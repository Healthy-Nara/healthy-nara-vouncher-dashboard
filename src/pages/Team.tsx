import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, resetUserPassword } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Save,
  Loader2,
  Plus,
  X,
  KeyRound,
  Power,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

export const Team = () => {
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

  const { data: users = [], isLoading } = useQuery<any[]>({
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
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => {
      invalidate();
      setResetId(null);
      setResetPassword('');
    },
  });

  const submitCreate = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Username and password are required');
      return;
    }
    createMutation.mutate({ username: newUsername.trim(), password: newPassword, role: newRole });
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="ADMINISTRATION"
          title="Team & Accounts"
          subtitle="Manage administrative credentials, roles, and Telegram integration IDs."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreate(true)}
              leftIcon={<Plus size={16} />}
            >
              Create User
            </Button>
          }
        />
      </div>

      {/* Users Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading team accounts...
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>USER</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>TELEGRAM CHAT ID</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any, index: number) => {
                      const isMe = u._id === currentUser?.id;
                      return (
                        <TableRow key={u._id} className={u.isActive === false ? 'opacity-60 bg-slate-50' : ''}>
                          {/* Row Number */}
                          <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold w-12">
                            {index + 1}
                          </TableCell>

                          {/* User Avatar & Name */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar name={u.username} size="sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 text-xs">
                                    {u.username}
                                  </p>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  ID: {u._id.slice(-6)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role Badge */}
                          <TableCell>
                            {u.role === 'admin' ? (
                              <Badge variant="teal" dot>
                                Admin
                              </Badge>
                            ) : u.role === 'caregiver' ? (
                              <Badge variant="purple" dot>
                                Caregiver
                              </Badge>
                            ) : (
                              <Badge variant="slate" dot>
                                Staff
                              </Badge>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant={u.isActive === false ? 'rose' : 'emerald'} dot>
                              {u.isActive === false ? 'Deactivated' : 'Active'}
                            </Badge>
                          </TableCell>

                          {/* Telegram Chat ID */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 max-w-xs">
                              <input
                                type="text"
                                placeholder="e.g. 123456789"
                                defaultValue={u.telegramChatId || ''}
                                onChange={(e) =>
                                  setChatIds((prev) => ({ ...prev, [u._id]: e.target.value }))
                                }
                                className="p-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono w-32"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const val = chatIds[u._id] !== undefined ? chatIds[u._id] : u.telegramChatId;
                                  updateMutation.mutate({ id: u._id, data: { telegramChatId: val } });
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-teal-600"
                                title="Save Chat ID"
                              >
                                <Save size={13} />
                              </Button>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="subtle"
                                size="xs"
                                onClick={() => setResetId(u._id)}
                                leftIcon={<KeyRound size={12} />}
                              >
                                Password
                              </Button>

                              {!isMe && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: u._id,
                                      data: { isActive: u.isActive === false ? true : false },
                                    })
                                  }
                                  className={`w-7 h-7 ${
                                    u.isActive === false
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title={u.isActive === false ? 'Activate' : 'Deactivate'}
                                >
                                  <Power size={13} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {users.map((u: any) => {
                  const isMe = u._id === currentUser?.id;
                  return (
                    <div
                      key={u._id}
                      className={`w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 ${
                        u.isActive === false ? 'opacity-60 bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.username} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 text-sm leading-tight">
                                {u.username}
                              </p>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {u._id.slice(-6)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {u.role === 'admin' ? (
                            <Badge variant="teal" dot>
                              Admin
                            </Badge>
                          ) : u.role === 'caregiver' ? (
                            <Badge variant="purple" dot>
                              Caregiver
                            </Badge>
                          ) : (
                            <Badge variant="slate" dot>
                              Staff
                            </Badge>
                          )}
                          <Badge variant={u.isActive === false ? 'rose' : 'emerald'} dot>
                            {u.isActive === false ? 'Deactivated' : 'Active'}
                          </Badge>
                        </div>
                      </div>

                      {/* Telegram ID Input & Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 text-xs">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Telegram ID"
                            defaultValue={u.telegramChatId || ''}
                            onChange={(e) =>
                              setChatIds((prev) => ({ ...prev, [u._id]: e.target.value }))
                            }
                            className="p-1 text-xs rounded-lg border border-slate-200 bg-white font-mono w-28"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const val = chatIds[u._id] !== undefined ? chatIds[u._id] : u.telegramChatId;
                              updateMutation.mutate({ id: u._id, data: { telegramChatId: val } });
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-teal-600"
                          >
                            <Save size={13} />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => setResetId(u._id)}
                            leftIcon={<KeyRound size={11} />}
                          >
                            Password
                          </Button>
                          {!isMe && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: u._id,
                                  data: { isActive: u.isActive === false ? true : false },
                                })
                              }
                              className={`w-7 h-7 ${
                                u.isActive === false
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Power size={13} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${users.length} accounts`}
            updatedText="Encrypted auth stored in MongoDB"
          />
        </CardContent>
      </Card>

      {/* CREATE USER MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Create New Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add a new admin or staff login</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="staff">Staff (Operational View)</option>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={createMutation.isPending}
                  onClick={submitCreate}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Reset Password</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setResetId(null)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setResetId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={resetMutation.isPending}
                  onClick={() => {
                    if (!resetPassword.trim()) return;
                    resetMutation.mutate({ id: resetId, password: resetPassword });
                  }}
                >
                  Save Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
