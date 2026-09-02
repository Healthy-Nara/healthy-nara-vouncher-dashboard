import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeads, createLead, deleteLead } from '../api';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Phone,
  MessageCircle,
  Users,
  ChevronRight,
  UserPlus,
  Trash2,
  CalendarDays,
  Loader2,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useStatsToggle } from '../hooks/useStatsToggle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

const ALL_STAGES = [
  { id: 'All', label: 'All Leads' },
  { id: 'New', label: 'New' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'Sale Closed', label: 'Sale Closed' },
  { id: 'Active Customer', label: 'Active Customer' },
  { id: 'Lost', label: 'Lost' },
];

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
  date: string;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

const emptyForm = (): LeadForm => ({
  customerName: '',
  phoneNumber: '',
  channel: 'Phone',
  requirements: '',
  notes: '',
  date: todayStr(),
});

export const Leads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showStats, toggleStats] = useStatsToggle('leads');

  const { data: allLeads = [], isLoading } = useQuery<any[]>({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(),
  });

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (stageFilter !== 'All') {
      result = result.filter((l: any) => l.stage === stageFilter);
    }
    if (dateFilter) {
      result = result.filter(
        (l: any) => l.date && new Date(l.date).toISOString().slice(0, 10) === dateFilter
      );
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (l: any) =>
          l.customerName?.toLowerCase().includes(s) ||
          l.phoneNumber?.includes(s) ||
          l.requirements?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allLeads, searchTerm, stageFilter, dateFilter]);

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

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: allLeads.length,
      New: 0,
      Contacted: 0,
      'Sale Closed': 0,
      'Active Customer': 0,
      Lost: 0,
    };
    allLeads.forEach((l: any) => {
      if (counts[l.stage] !== undefined) counts[l.stage]++;
    });
    return counts;
  }, [allLeads]);

  const tabItems = useMemo(() => {
    return ALL_STAGES.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: stageCounts[tab.id] || 0,
    }));
  }, [stageCounts]);

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'New':
        return <Badge variant="emerald" dot>New</Badge>;
      case 'Contacted':
        return <Badge variant="amber" dot>Contacted</Badge>;
      case 'Sale Closed':
        return <Badge variant="teal" dot>Sale Closed</Badge>;
      case 'Active Customer':
        return <Badge variant="purple" dot>Active Customer</Badge>;
      case 'Lost':
        return <Badge variant="rose" dot>Lost</Badge>;
      default:
        return <Badge variant="slate" dot>{stage}</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phoneNumber.trim()) {
      alert('Please fill customer name and phone number');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="CUSTOMER RELATIONS"
          title="Leads Pipeline"
          subtitle="Manage customer inquiries, channels, and conversion stages."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStats}
                leftIcon={showStats ? <EyeOff size={14} /> : <Filter size={14} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                title={showStats ? 'Hide pipeline tabs & search' : 'Show pipeline tabs & search'}
              >
                {showStats ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus size={16} />}
              >
                Add New Lead
              </Button>
            </>
          }
        />
      </div>

      {/* Tabs and Search (Collapsible) */}
      {showStats && (
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <Tabs
            items={tabItems}
            activeId={stageFilter}
            onChange={(id) => setStageFilter(id)}
          />

          <div className="flex items-center gap-2">
            <div className="w-full md:w-64">
              <SearchInput
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
              title="Filter by date"
            />
          </div>
        </div>
      )}

      {/* Leads Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Inquiries & Leads</CardTitle>
            <CardDescription>
              {filteredLeads.length} of {allLeads.length} total leads
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading leads pipeline...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No leads match your criteria</p>
              <p className="text-xs text-slate-400">Add an inquiry or clear your search filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CUSTOMER NAME</TableHead>
                      <TableHead>CHANNEL</TableHead>
                      <TableHead>REQUIREMENTS</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>STAGE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead: any) => {
                      const ChannelIcon = CHANNEL_ICONS[lead.channel] || Phone;
                      return (
                        <TableRow
                          key={lead._id}
                          onClick={() => navigate(`/leads/${lead._id}`)}
                          className="cursor-pointer group"
                        >
                          {/* Customer Name with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar name={lead.customerName} size="sm" />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                                  {lead.customerName}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={10} />
                                  <span>{lead.phoneNumber || '—'}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Channel */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <ChannelIcon size={14} className="text-teal-600" />
                              <span>{lead.channel || 'Phone'}</span>
                            </div>
                          </TableCell>

                          {/* Requirements */}
                          <TableCell>
                            <p className="text-xs text-slate-600 max-w-xs truncate">
                              {lead.requirements || 'No specific requirements'}
                            </p>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <CalendarDays size={13} className="text-slate-400" />
                              <span>{fmtDate(lead.date || lead.createdAt)}</span>
                            </div>
                          </TableCell>

                          {/* Stage Badge */}
                          <TableCell>{getStageBadge(lead.stage || 'New')}</TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/leads/${lead._id}`);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-700"
                                title="View lead"
                              >
                                <ChevronRight size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(lead._id);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-rose-600"
                                title="Delete lead"
                              >
                                <Trash2 size={13} />
                              </Button>
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
                {filteredLeads.map((lead: any) => {
                  const ChannelIcon = CHANNEL_ICONS[lead.channel] || Phone;
                  return (
                    <div
                      key={lead._id}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={lead.customerName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{lead.customerName}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} />
                              <span>{lead.phoneNumber || '—'}</span>
                            </p>
                          </div>
                        </div>
                        {getStageBadge(lead.stage || 'New')}
                      </div>

                      {lead.requirements && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {lead.requirements}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                          <ChannelIcon size={12} className="text-teal-600" />
                          <span>{lead.channel || 'Phone'}</span>
                          <span className="text-slate-300">•</span>
                          <span>{fmtDate(lead.date || lead.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(lead._id);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </Button>
                          <ChevronRight size={15} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredLeads.length} of ${allLeads.length} leads`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add New Lead</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record new customer inquiry and contact details
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  required
                  placeholder="e.g. Daw Su Myat"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    required
                    placeholder="09..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inquiry Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Phone">Phone Call</option>
                    <option value="Messenger">Facebook Messenger</option>
                    <option value="Viber">Viber</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Care Requirements</label>
                <input
                  type="text"
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="e.g. Newborn Care 24 hrs for 1 month"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Inquiry Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about customer preferences..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={createMutation.isPending}
                >
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">Delete Lead?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this lead record?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
