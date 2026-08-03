import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, createTicket, fetchTicketUsers } from '../api';
import { LifeBuoy, Plus, Search, Loader2, ChevronRight, X, Flag } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Open':        { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  'In Progress': { color: 'text-blue-700',   bg: 'bg-blue-100' },
  'Pending':     { color: 'text-orange-700', bg: 'bg-orange-100' },
  'Resolved':    { color: 'text-green-700',  bg: 'bg-green-100' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  'Low':    { color: 'text-gray-600', bg: 'bg-gray-100' },
  'Medium': { color: 'text-amber-700', bg: 'bg-amber-100' },
  'High':   { color: 'text-red-700',  bg: 'bg-red-100' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('my-MM', { year: 'numeric', month: 'short', day: 'numeric' });

const Tickets = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', search, statusFilter],
    queryFn: () => fetchTickets({ search: search || undefined, status: statusFilter || undefined }),
  });

  const { data: users } = useQuery({
    queryKey: ['ticketUsers'],
    queryFn: () => fetchTicketUsers(),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssignee('');
    },
  });

  const submit = () => {
    if (!title.trim() || !description.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to: assignee || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Team issue အစီရင်ခံ စီမံခန့်ခွဲရန်</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="text-gray-400 h-5 w-5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title / description..."
            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        >
          <option value="">All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Pending</option>
          <option>Resolved</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="text-center py-16">
            <LifeBuoy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Ticket မရှိပါ</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Ticket</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Priority</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Assigned To</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((t: any) => (
                    <tr key={t._id} onClick={() => navigate(`/tickets/${t._id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.color}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[t.priority]?.bg} ${PRIORITY_CONFIG[t.priority]?.color}`}>
                          <Flag className="h-3 w-3" /> {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.assignedName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {tickets.map((t: any) => (
                <div key={t._id} onClick={() => navigate(`/tickets/${t._id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{t.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                    </div>
                    <ChevronRight className="text-gray-400 h-5 w-5 shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.color}`}>{t.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_CONFIG[t.priority]?.bg} ${PRIORITY_CONFIG[t.priority]?.color}`}>{t.priority}</span>
                    {t.assignedName && <span className="text-[11px] text-gray-500">→ {t.assignedName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Ticket</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ဥပမာ - Website down"
                  className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="အသေးစိတ် ဖော်ပြပါ"
                  className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Assign To</label>
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50">
                    <option value="">None</option>
                    {users?.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={submit}
                disabled={!title.trim() || !description.trim() || createMutation.isPending}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
