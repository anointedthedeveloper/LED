import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Power, PowerOff, RefreshCw, Settings, LogOut } from 'lucide-react';
import BotCard from '@/components/BotCard';
import CreateBotModal from '@/components/CreateBotModal';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadBots();
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadBots = async () => {
    try {
      const { data } = await api.getBots();
      setBots(data.bots);
    } catch (error: any) {
      toast.error('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-dark">LED Dashboard</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 btn-secondary"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Bots</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            Create Bot
          </button>
        </div>

        {bots.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No bots yet. Create your first bot!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} onUpdate={loadBots} />
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateBotModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBots();
          }}
        />
      )}
    </div>
  );
}
