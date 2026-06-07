import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeads, createLead, deleteLead } from '../api';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Phone, MessageCircle, Users, ChevronRight, UserPlus, Clock, Trash2 } from 'lucide-react';

const ALL_STAGES = ['All', 'New', 'Contacted', 'Sale Closed', 'Active Customer', 'Lost'] as const;

const STAGE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'New':            { color: 'text-green-700',  bg: 'bg-green-100',  icon: '🟢' },
  'Contacted':      { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🟡' },
  'Sale Closed':    { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Active Customer':{ color: 'text-purple-700', bg: 'bg-purple-100', icon: '🟣' },
  'Lost':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const CHANNEL_ICONS: Record<string, typeof Phone> = {
  Messenger: MessageCircle,
  Phone: Phone,
  Viber: MessageCircle,
  'Walk-in': Users,
  Referral: UserPlus,
  Other: Phone,
};

interface LeadForm {
  customerName: string;
  phoneNumber: string;
  channel: string;
  requirements: string;
  notes: string;
}

const emptyForm = (): LeadForm => ({
  customerName: '', phoneNumber: '', channel: 'Phone', requirements: '', notes: '',
});

const Leads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(),
  });

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (stageFilter !== 'All') {
      result = result.filter((l: any) => l.stage === stageFilter);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((l: any) =>
        l.customerName?.toLowerCase().includes(s) ||
        l.phoneNumber?.includes(s) ||
        l.requirements?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allLeads, searchTerm, stageFilter]);

  const createMutation = useMutation({
    mutationFn: (data: LeadForm) => createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsModalOpen(false);
      setForm(emptyForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDeleteConfirmId(null);
    },
  });

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allLeads.length };
    ALL_STAGES.forEach(s => { if (s !== 'All') counts[s] = 0; });
    allLeads.forEach((l: any) => { counts[l.stage || 'New']++; });
    return counts;
  }, [allLeads]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{allLeads.length} total leads</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setIsModalOpen(true); }}
          className="hidden md:inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all"
        >
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or requirements..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
          />
        </div>
        {/* Stage Filter Pills - Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden scrollbar-hide">
          {ALL_STAGES.map(stage => {
            const config = STAGE_CONFIG[stage];
            const isActive = stageFilter === stage;
            return (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? stage === 'All'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${config?.bg || 'bg-gray-100'} ${config?.color || 'text-gray-700'} border-current`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {config?.icon && <span className="mr-1">{config.icon}</span>}
                {stage}
                <span className="ml-1 opacity-60">{stageCounts[stage] || 0}</span>
              </button>
            );
          })}
        </div>
        {/* Stage Filter Dropdown - Desktop */}
        <div className="hidden md:block">
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            {ALL_STAGES.map(s => (
              <option key={s} value={s}>{s} ({stageCounts[s] || 0})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lead List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No leads found</p>
          <button
            onClick={() => { setForm(emptyForm()); setIsModalOpen(true); }}
            className="mt-3 text-primary text-sm font-bold hover:underline"
          >
            + Create your first lead
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {filteredLeads.map((lead: any) => {
              const config = STAGE_CONFIG[lead.stage || 'New'] || STAGE_CONFIG['New'];
              const ChannelIcon = CHANNEL_ICONS[lead.channel] || Phone;
              return (
                <div
                  key={lead._id}
                  onClick={() => navigate(`/leads/${lead._id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                          {config.icon} {lead.stage || 'New'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{lead.customerName}</h3>
                      <a
                        href={`tel:${lead.phoneNumber}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-primary font-medium mt-0.5 inline-flex items-center gap-1"
                      >
                        <Phone size={10} />
                        {lead.phoneNumber}
                      </a>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                      <ChannelIcon size={10} />
                      {lead.channel}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {getTimeAgo(lead.createdAt)}
                    </span>
                  </div>

                  {lead.requirements && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lead.requirements}</p>
                  )}

                  {lead.assignedStaffName && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                      <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold">
                        {lead.assignedStaffName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-gray-400">{lead.assignedStaffName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Channel</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Stage</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Staff</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead: any) => {
                    const config = STAGE_CONFIG[lead.stage || 'New'] || STAGE_CONFIG['New'];
                    const ChannelIcon = CHANNEL_ICONS[lead.channel] || Phone;
                    return (
                      <tr
                        key={lead._id}
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">{lead.customerName}</span>
                          {lead.requirements && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{lead.requirements}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`tel:${lead.phoneNumber}`}
                            onClick={e => e.stopPropagation()}
                            className="text-primary font-medium hover:underline"
                          >
                            {lead.phoneNumber}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            <ChannelIcon size={10} />
                            {lead.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                            {config.icon} {lead.stage || 'New'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {lead.assignedStaffName && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                {lead.assignedStaffName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-gray-600 text-xs">{lead.assignedStaffName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{getTimeAgo(lead.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead._id}`); }}
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                              <ChevronRight size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(lead._id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setForm(emptyForm()); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-primary-dark hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus size={24} />
      </button>

      {/* Create Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 md:duration-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">Channel *</label>
                <select
                  value={form.channel}
                  onChange={e => setForm({ ...form, channel: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="Phone">Phone</option>
                  <option value="Messenger">Messenger</option>
                  <option value="Viber">Viber</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">Requirements</label>
                <textarea
                  value={form.requirements}
                  onChange={e => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  placeholder="Customer ရဲ့ လိုအပ်ချက်များ..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  placeholder="အတွင်းမှတ်စုများ..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (form.customerName && form.phoneNumber) {
                    createMutation.mutate(form);
                  }
                }}
                disabled={!form.customerName || !form.phoneNumber || createMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2.5 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Delete Lead</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this lead? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all py-2.5 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
