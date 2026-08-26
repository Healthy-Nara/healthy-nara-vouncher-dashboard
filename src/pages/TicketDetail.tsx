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
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Tickets"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{ticket.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.color}`}>{ticket.status}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {ticket.createdByName} က {formatDateTime(ticket.createdAt)} တွင် ဖန်တီးခဲ့သည်
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description Card */}
          <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-6 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="text-[#0d6d5c] h-4 w-4" />
              <span className="text-xs font-bold uppercase text-slate-500">{ticket.priority} Priority</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Comments Card */}
          <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-6 border border-slate-200/80">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Comments ({comments.length})</h2>
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-xs text-slate-400 italic">Comment မရှိသေးပါ</p>}
              {comments.map((c: any) => (
                <div key={c._id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{c.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{c.message}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentMutation.mutate(comment.trim()); }}
                placeholder="Comment ရေးရန်..."
                className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-slate-50 outline-none"
              />
              <button
                onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
                disabled={!comment.trim() || commentMutation.isPending}
                className="p-2.5 bg-[#0d6d5c] text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Update Status */}
          <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => s !== ticket.status && statusMutation.mutate(s)}
                  disabled={s === ticket.status}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    s === ticket.status
                      ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-[#0d6d5c]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment (admin only) */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-5 border border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Assignment</h3>
              <div className="flex items-center gap-2">
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-slate-50 outline-none"
                >
                  <option value="">Unassigned</option>
                  {users?.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
                <button
                  onClick={() => assignMutation.mutate(assignee || undefined)}
                  disabled={assignMutation.isPending}
                  className="px-3 py-2 bg-[#0d6d5c] text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
              </div>
              {ticket.assignedName && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-slate-400" /> {ticket.assignedName}
                </p>
              )}
            </div>
          )}

          {/* Activity History */}
          <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Activity History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">မှတ်တမ်း မရှိသေးပါ</p>
            ) : (
              <div className="border-l-2 border-slate-100 ml-2 space-y-3.5">
                {history.map((h: any) => (
                  <div key={h._id} className="relative pl-3.5">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#0d6d5c]" />
                    <p className="text-xs font-medium text-slate-700">{h.action_performed}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{h.userName} · {formatDateTime(h.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {canDelete && (
            <div className="bg-white rounded-2xl shadow-2xs p-4 sm:p-5 border border-rose-200/80">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-3">Danger Zone</h3>
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete Ticket?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">ဒီ ticket နဲ့ comments/မှတ်တမ်းအားလုံး ဖျက်ပစ်မှာပါ။ ပြန်ယူလို့မရပါ။</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate()} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all">
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
