import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Power, PowerOff, RefreshCw, Save } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function BotDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [bot, setBot] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (id) {
      loadBotData();
      loadCommands();
      const interval = setInterval(checkQRCode, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadBotData = async () => {
    try {
      const [botRes, logsRes] = await Promise.all([
        api.getBot(id as string),
        api.getBotLogs(id as string)
      ]);
      setBot(botRes.data.bot);
      setConfig(botRes.data.bot.config);
      setLogs(logsRes.data.logs);
    } catch (error) {
      toast.error('Failed to load bot data');
    } finally {
      setLoading(false);
    }
  };

  const loadCommands = async () => {
    try {
      const { data } = await api.getCommands();
      setCommands(data.commands);
    } catch (error) {
      console.error('Failed to load commands');
    }
  };

  const checkQRCode = async () => {
    if (bot?.status === 'pairing_required') {
      try {
        const { data } = await api.getQRCode(id as string);
        setQrCode(data.qrCode);
      } catch (error) {
        setQrCode(null);
      }
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.updateBotConfig(id as string, config);
      toast.success('Configuration saved');
      loadBotData();
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const toggleCommand = (commandName: string) => {
    setConfig((prev: any) => ({
      ...prev,
      enabledCommands: prev.enabledCommands.includes(commandName)
        ? prev.enabledCommands.filter((c: string) => c !== commandName)
        : [...prev.enabledCommands, commandName]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-dark">
            {bot?.phoneNumber || 'Bot Details'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status & QR Code */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Status</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <p className="font-semibold text-lg">{bot?.status}</p>
                </div>

                {qrCode && bot?.status === 'pairing_required' && (
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2 text-center">
                      Scan with WhatsApp
                    </p>
                    <div className="bg-white p-4 rounded">
                      <QRCode value={qrCode} size={200} className="mx-auto" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Logs */}
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Recent Logs</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-sm border-l-2 border-gray-300 pl-3 py-1">
                    <p className="text-gray-600 text-xs">
                      {new Date(log.timestamp._seconds * 1000).toLocaleString()}
                    </p>
                    <p className="font-medium">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Configuration</h2>
                <button onClick={handleSaveConfig} className="btn-primary flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Settings */}
                <div>
                  <h3 className="font-semibold mb-3">Basic Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Command Prefix
                      </label>
                      <input
                        type="text"
                        value={config.prefix || '-'}
                        onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sticker Author
                      </label>
                      <input
                        type="text"
                        value={config.stickerAuthor || ''}
                        onChange={(e) => setConfig({ ...config, stickerAuthor: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.antiDelete || false}
                        onChange={(e) => setConfig({ ...config, antiDelete: e.target.checked })}
                        className="rounded"
                      />
                      <span>Anti-Delete Messages</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.autoViewStatus || false}
                        onChange={(e) => setConfig({ ...config, autoViewStatus: e.target.checked })}
                        className="rounded"
                      />
                      <span>Auto View Status</span>
                    </label>
                  </div>
                </div>

                {/* Commands */}
                <div>
                  <h3 className="font-semibold mb-3">Enabled Commands</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {commands.map((cmd) => (
                      <label key={cmd.name} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={config.enabledCommands?.includes(cmd.name) || false}
                          onChange={() => toggleCommand(cmd.name)}
                          className="rounded"
                        />
                        <span className="font-mono">{cmd.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
