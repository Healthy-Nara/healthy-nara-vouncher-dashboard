import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, resetUserPassword } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, Save, Loader2, MessageCircle, Plus, X, KeyRound, Power, ShieldCheck } from 'lucide-react';

const Team = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [chatIds, setChatIds] = useState<Record<string, string>>({});

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');

  // Reset password modal state
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('staff');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetUserPassword(id, password),
    onSuccess: () => {
      invalidate();
      setResetId(null);
      setResetPassword('');
    },
  });

  const submitCreate = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    createMutation.mutate({ username: newUsername.trim(), password: newPassword, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Team member အကောင့်များ စီမံခန့်ခွဲရန်</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Create User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">User</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Role</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Telegram Chat ID</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u: any) => {
              const isMe = u._id === currentUser?.id;
              return (
                <tr key={u._id} className={u.isActive === false ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                        <Users className="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{u.username}</span>
                        {isMe && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">you</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateMutation.mutate({ id: u._id, data: { role: e.target.value } })}
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {u.isActive === false ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-gray-400 h-4 w-4" />
                      <input
                        value={chatIds[u._id] ?? u.telegramChatId ?? ''}
                        onChange={(e) => setChatIds((prev) => ({ ...prev, [u._id]: e.target.value }))}
                        placeholder="e.g. 123456789"
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary w-40"
                      />
                      <button
                        onClick={() => updateMutation.mutate({ id: u._id, data: { telegramChatId: (chatIds[u._id] ?? u.telegramChatId ?? '').trim() } })}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
                        title="Save Telegram ID"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResetId(u._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                        title="Reset password"
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Password
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: u._id, data: { isActive: u.isActive === false } })}
                        disabled={isMe}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                          u.isActive === false
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title={u.isActive === false ? 'Enable account' : 'Disable account'}
                      >
                        <Power className="h-3.5 w-3.5" /> {u.isActive === false ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
        <p className="text-sm text-gray-600">
          <ShieldCheck className="inline h-4 w-4 mr-1 text-primary" />
          💡 <span className="font-semibold">Telegram Chat ID:</span> Telegram ထဲမှာ{' '}
          <code className="bg-white px-1.5 py-0.5 rounded text-primary font-mono text-xs">@userinfobot</code>{' '}
          ကို ရှာပြီး "Start" နှိပ်ပါ — သင့် ID ကို ပြပေးပါလိမ့်မယ်။ Ticket assign ရတဲ့အခါ ဒီဆီကို သတိပေးချက် ပို့ပါမယ်။
        </p>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Create User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                >
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <button
                onClick={submitCreate}
                disabled={!newUsername.trim() || !newPassword.trim() || createMutation.isPending}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Reset Password</h2>
              <button onClick={() => setResetId(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <label className="text-xs font-semibold text-gray-500 uppercase">New Password</label>
            <input
              type="text"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
            />
            <button
              onClick={() => resetMutation.mutate({ id: resetId, password: resetPassword })}
              disabled={!resetPassword.trim() || resetMutation.isPending}
              className="w-full mt-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {resetMutation.isPending ? 'Saving...' : 'Save New Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
