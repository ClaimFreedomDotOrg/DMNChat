import React, { useState, useEffect } from 'react';
import { Database, Users, MessageSquare, Activity } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface SystemStats {
  totalUsers: number;
  totalRepositories: number;
  totalChunks: number;
  activeChats: number;
}

const OverviewPanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalRepositories: 0,
    totalChunks: 0,
    activeChats: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get total repositories
      const reposSnapshot = await getDocs(collection(db, 'contextSources'));
      const totalRepositories = reposSnapshot.size;

      // Get total chunks
      const chunksSnapshot = await getDocs(collection(db, 'chunks'));
      const totalChunks = chunksSnapshot.size;

      // Get active chats (simplified - counts all chats)
      let activeChats = 0;
      for (const userDoc of usersSnapshot.docs) {
        const chatsSnapshot = await getDocs(
          collection(db, 'users', userDoc.id, 'chats')
        );
        activeChats += chatsSnapshot.size;
      }

      setStats({
        totalUsers,
        totalRepositories,
        totalChunks,
        activeChats,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Repositories',
      value: stats.totalRepositories,
      icon: Database,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
    },
    {
      title: 'Indexed Chunks',
      value: stats.totalChunks,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Chats',
      value: stats.activeChats,
      icon: MessageSquare,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">System Overview</h2>
        <p className="text-slate-400">Monitor system health and usage statistics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon size={24} className={card.color} />
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-200">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={loadStats}
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-sky-600 transition-colors text-left"
          >
            <h4 className="font-medium text-slate-200 mb-1">Refresh Statistics</h4>
            <p className="text-sm text-slate-500">Update all dashboard metrics</p>
          </button>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h4 className="font-medium text-slate-200 mb-1">System Status</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
