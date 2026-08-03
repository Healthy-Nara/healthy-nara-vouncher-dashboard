import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTicketById, updateTicketStatus, assignTicket, addTicketComment, deleteTicket, fetchTicketUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, Trash2, Flag, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';

const STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved'];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Open':        { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  'In Progress': { color: 'text-blue-700',   bg: 'bg-blue-100' },
  'Pending':     { color: 'text-orange-700', bg: 'bg-orange-100' },
  'Resolved':    { color: 'text-green-700',  bg: 'bg-green-100' },
};

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('my-MM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [comment, setComment] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketById(id!),
    enabled: !!id,
  });
  const ticket = data?.ticket;
  const comments = data?.comments || [];
  const history = data?.history || [];

  const { data: users } = useQuery({
    queryKey: ['ticketUsers'],
    queryFn: () => fetchTicketUsers(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateTicketStatus(id!, status),
    onSuccess: invalidate,
  });
  const assignMutation = useMutation({
    mutationFn: (userId: string | undefined) => assignTicket(id!, userId),
    onSuccess: () => {
      invalidate();
      setAssignee('');
    },
  });
  const commentMutation = useMutation({
    mutationFn: (message: string) => addTicketComment(id!, message),
    onSuccess: () => {
      invalidate();
      setComment('');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteTicket(id!),
    onSuccess: () => navigate('/tickets'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  if (!ticket) {
    return <p className="text-center text-gray-500 py-24">Ticket ရှာမတွေ့ပါ</p>;
  }

  const canDelete = user?.role === 'superadmin' || ticket.created_by === user?.id || ticket.assigned_to === user?.id;
  const badge = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['Open'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-gray-900">{ticket.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>{ticket.status}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {ticket.createdByName} က {formatDateTime(ticket.createdAt)} တွင် ဖန်တီးခဲ့သည်
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="text-primary h-5 w-5" />
              <span className="text-xs font-bold uppercase text-gray-500">{ticket.priority} Priority</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <h2 className="font-bold text-gray-900 mb-4">Comments ({comments.length})</h2>
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-sm text-gray-500">Comment မရှိသေးပါ</p>}
              {comments.map((c: any) => (
                <div key={c._id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{c.userName}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.message}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentMutation.mutate(comment.trim()); }}
                placeholder="Comment ရေးရန်..."
                className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
              />
              <button
                onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
                disabled={!comment.trim() || commentMutation.isPending}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <h3 className="font-bold text-gray-900 mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => s !== ticket.status && statusMutation.mutate(s)}
                  disabled={s === ticket.status}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    s === ticket.status
                      ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`
                      : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment (admin only) */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
              <h3 className="font-bold text-gray-900 mb-3">Assignment</h3>
              <div className="flex items-center gap-2">
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-primary focus:border-primary bg-gray-50"
                >
                  <option value="">Unassigned</option>
                  {users?.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
                <button
                  onClick={() => assignMutation.mutate(assignee || undefined)}
                  disabled={assignMutation.isPending}
                  className="px-3 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {ticket.assignedName && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> {ticket.assignedName}
                </p>
              )}
            </div>
          )}

          {/* Danger Zone */}
          {canDelete && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
              <h3 className="font-bold text-red-600 mb-3">Danger Zone</h3>
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
              >
                <Trash2 className="h-4 w-4" /> Delete Ticket
              </button>
            </div>
          )}

          {/* Activity History */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <h3 className="font-bold text-gray-900 mb-4">Activity History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">မှတ်တမ်း မရှိသေးပါ</p>
            ) : (
              <div className="border-l-2 border-gray-200 ml-2 space-y-4">
                {history.map((h: any) => (
                  <div key={h._id} className="relative pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm text-gray-700">{h.action_performed}</p>
                    <p className="text-xs text-gray-400">{h.userName} · {formatDateTime(h.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold">Delete Ticket?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">ဒီ ticket နဲ့ comments/မှတ်တမ်းအားလုံး ဖျက်ပစ်မှာပါ။ ပြန်ယူလို့မရပါ။</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate()} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
