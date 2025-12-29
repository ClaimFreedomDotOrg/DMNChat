import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { updateUserRole, updateUserMemberLevel, getSystemConfig } from '@/services/adminService';
import { UserProfile, MemberLevel } from '@/types';
import { Shield, User, Trash2, Mail, Calendar, Award, MessageSquare } from 'lucide-react';

const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([]);

  useEffect(() => {
    loadUsers();
    loadMemberLevels();
  }, []);

  const loadMemberLevels = async () => {
    try {
      const config = await getSystemConfig();
      setMemberLevels(config.memberLevels);
    } catch (err) {
      console.error('Error loading member levels:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      } as UserProfile));

      // Sort by creation date (newest first)
      usersData.sort((a, b) => {
        const aDate = typeof a.createdAt === 'number' ? a.createdAt : 0;
        const bDate = typeof b.createdAt === 'number' ? b.createdAt : 0;
        return bDate - aDate;
      });

      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      // Use Cloud Function to update role
      await updateUserRole(userId, newRole);

      // Update local state
      setUsers(users.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const changeMemberLevel = async (userId: string, newLevel: string) => {
    try {
      await updateUserMemberLevel(userId, newLevel);

      // Update local state
      setUsers(users.map(user =>
        user.uid === userId ? { ...user, memberLevel: newLevel } : user
      ));
    } catch (err) {
      console.error('Error updating member level:', err);
      setError('Failed to update member level');
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));

      // Note: This only deletes the Firestore document
      // Deleting the Firebase Auth user requires admin SDK on backend
      setUsers(users.filter(user => user.uid !== userId));

      alert('User document deleted. Note: Firebase Auth account still exists and should be deleted via Firebase Console or backend function.');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const formatDate = (timestamp: number | any) => {
    if (!timestamp) return 'N/A';

    // Handle Firestore Timestamp objects
    let date: Date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">User Management</h2>
        <p className="text-slate-400">Manage user accounts and permissions</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <User size={20} className="text-sky-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-200">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Administrators</p>
              <p className="text-2xl font-bold text-slate-200">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <User size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Regular Users</p>
              <p className="text-2xl font-bold text-slate-200">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">All Users</h3>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
        </div>

        {users.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.uid}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-500" />
                      <span className="text-slate-200 font-medium">{user.email}</span>
                      {user.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Display Name */}
                    {user.displayName && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500" />
                        <span className="text-sm text-slate-400">{user.displayName}</span>
                      </div>
                    )}

                    {/* Member Level */}
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-slate-500" />
                      <span className="text-sm text-slate-400">Member Level:</span>
                      <select
                        value={user.memberLevel || 'free'}
                        onChange={(e) => changeMemberLevel(user.uid, e.target.value)}
                        className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded hover:border-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                      >
                        {memberLevels.map(level => (
                          <option key={level.name} value={level.name}>
                            {level.displayName} ({level.messagesPerDay === -1 ? 'Unlimited' : `${level.messagesPerDay}/day`})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message Usage */}
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-slate-500" />
                      <span className="text-sm text-slate-400">
                        Messages today: {user.messageUsage?.count || 0}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500" />
                      <span className="text-sm text-slate-400">
                        Joined {formatDate(user.createdAt)}
                      </span>
                    </div>

                    {/* User ID */}
                    <div className="text-xs text-slate-600 font-mono">
                      ID: {user.uid}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleAdminRole(user.uid, user.role)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        user.role === 'admin'
                          ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Shield size={14} className="inline mr-1" />
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.uid, user.email)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;
