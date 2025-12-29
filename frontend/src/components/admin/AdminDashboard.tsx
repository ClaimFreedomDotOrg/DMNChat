import React, { useState } from 'react';
import { Settings, Users, Database, LayoutDashboard, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import RepositoryPanel from './panels/RepositoryPanel';
import UserManagementPanel from './panels/UserManagementPanel';
import SystemConfigPanel from './panels/SystemConfigPanel';
import OverviewPanel from './panels/OverviewPanel';

type Panel = 'overview' | 'repositories' | 'users' | 'config';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activePanel, setActivePanel] = useState<Panel>('overview');
  const { user, profile } = useAuth();

  if (!isOpen) return null;

  // Check if user is admin
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-200 mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-4">You need admin privileges to access this dashboard.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'repositories', label: 'Repositories', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'config', label: 'System Config', icon: Settings },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-semibold text-slate-200">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage system configuration and users</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            aria-label="Close dashboard"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-slate-800 bg-slate-900/50 p-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info */}
            <div className="mt-8 pt-4 border-t border-slate-800">
              <div className="px-4">
                <p className="text-xs text-slate-500 mb-1">Logged in as</p>
                <p className="text-sm text-slate-300 font-medium truncate">{user?.email}</p>
                <p className="text-xs text-sky-400 mt-1">Administrator</p>
              </div>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'overview' && <OverviewPanel />}
            {activePanel === 'repositories' && <RepositoryPanel />}
            {activePanel === 'users' && <UserManagementPanel />}
            {activePanel === 'config' && <SystemConfigPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
