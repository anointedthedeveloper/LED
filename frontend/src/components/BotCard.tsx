import { useState } from 'react';
import { useRouter } from 'next/router';
import { Power, PowerOff, RefreshCw, Settings, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface BotCardProps {
  bot: any;
  onUpdate: () => void;
}

export default function BotCard({ bot, onUpdate }: BotCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const badges: any = {
      online: 'badge-online',
      offline: 'badge-offline',
      pairing_required: 'badge-pairing',
      error: 'badge-error',
      banned: 'badge-error',
      connecting: 'badge-pairing'
    };
    return badges[status] || 'badge-offline';
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data } = await api.startBot(bot.id);
      if (data.success) {
        toast.success('Bot started successfully');
        if (data.qrCode) {
          router.push(`/bot/${bot.id}/pair`);
        }
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to start bot');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.stopBot(bot.id);
      toast.success('Bot stopped');
      onUpdate();
    } catch (error) {
      toast.error('Failed to stop bot');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeploy = async () => {
    if (!confirm('This will disconnect and reset the bot. Continue?')) return;
    
    setLoading(true);
    try {
      const { data } = await api.redeployBot(bot.id);
      if (data.success) {
        toast.success('Bot redeployed successfully');
        if (data.qrCode) {
          router.push(`/bot/${bot.id}/pair`);
        }
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to redeploy bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{bot.phoneNumber || 'New Bot'}</h3>
          <span className={`badge ${getStatusBadge(bot.status)} mt-2`}>
            {bot.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <p>Prefix: <span className="font-mono">{bot.config?.prefix || '-'}</span></p>
        <p>Commands: {bot.config?.enabledCommands?.length || 0} enabled</p>
        {bot.lastConnected && (
          <p>Last connected: {new Date(bot.lastConnected._seconds * 1000).toLocaleString()}</p>
        )}
      </div>

      <div className="flex gap-2">
        {bot.status === 'offline' || bot.status === 'error' ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm"
          >
            <Power size={16} />
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 btn-danger text-sm"
          >
            <PowerOff size={16} />
            Stop
          </button>
        )}

        <button
          onClick={handleRedeploy}
          disabled={loading}
          className="flex items-center justify-center gap-2 btn-secondary text-sm px-3"
          title="Redeploy"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={() => router.push(`/bot/${bot.id}`)}
          className="flex items-center justify-center gap-2 btn-secondary text-sm px-3"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}
