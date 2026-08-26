import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, createTicket, fetchTicketUsers } from '../api';
import {
  LifeBuoy,
  Plus,
  Loader2,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';
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

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

export const Tickets = () => {
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

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ['tickets', search, statusFilter],
    queryFn: () =>
      fetchTickets({ search: search || undefined, status: statusFilter || undefined }),
  });

  const { data: users = [] } = useQuery<any[]>({
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
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to: assignee || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge variant="amber" dot>Open</Badge>;
      case 'In Progress':
        return <Badge variant="sky" dot>In Progress</Badge>;
      case 'Pending':
        return <Badge variant="slate" dot>Pending</Badge>;
      case 'Resolved':
        return <Badge variant="emerald" dot>Resolved</Badge>;
      default:
        return <Badge variant="teal" dot>{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High':
        return <span className="text-xs font-bold text-rose-600">● High</span>;
      case 'Medium':
        return <span className="text-xs font-bold text-amber-600">● Medium</span>;
      default:
        return <span className="text-xs font-bold text-slate-500">● Low</span>;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="SUPPORT & ISSUES"
          title="Support Tickets"
          subtitle="Manage customer requests, operational tickets, and team escalations."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowModal(true)}
              leftIcon={<Plus size={16} />}
            >
              New Ticket
            </Button>
          }
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search tickets by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="">Status: All</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Tickets List</CardTitle>
            <CardDescription>
              {tickets.length} total tickets found
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <LifeBuoy className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No tickets found</p>
              <p className="text-xs text-slate-400">Create a support ticket or reset search filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TICKET TITLE</TableHead>
                      <TableHead>PRIORITY</TableHead>
                      <TableHead>ASSIGNEE</TableHead>
                      <TableHead>CREATED DATE</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t: any) => (
                      <TableRow
                        key={t._id}
                        onClick={() => navigate(`/tickets/${t._id}`)}
                        className="cursor-pointer group"
                      >
                        {/* Title & Description */}
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-teal-600 transition-colors">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-sm truncate mt-0.5">
                              {t.description}
                            </p>
                          </div>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>{getPriorityBadge(t.priority)}</TableCell>

                        {/* Assignee with Avatar */}
                        <TableCell>
                          {t.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={t.assigned_to.username || 'User'} size="xs" />
                              <span className="text-xs font-semibold text-slate-800">
                                {t.assigned_to.username}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </TableCell>

                        {/* Created Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{formatDate(t.created_at || t.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>{getStatusBadge(t.status)}</TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tickets/${t._id}`);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-teal-600"
                            title="View ticket"
                          >
                            <ChevronRight size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {tickets.map((t: any) => (
                  <div
                    key={t._id}
                    onClick={() => navigate(`/tickets/${t._id}`)}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {getPriorityBadge(t.priority)}
                          {getStatusBadge(t.status)}
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{t.title}</p>
                      </div>
                    </div>

                    {t.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {t.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                        {t.assigned_to ? (
                          <>
                            <Avatar name={t.assigned_to.username || 'User'} size="xs" />
                            <span>{t.assigned_to.username}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                        <span className="text-slate-300">•</span>
                        <span>{formatDate(t.created_at || t.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-teal-600 font-bold text-xs">
                        <span>Details</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${tickets.length} tickets`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Create Support Ticket</h3>
                <p className="text-xs text-slate-500 mt-0.5">Report team issues or customer escalations</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ticket Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summary of the issue..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detailed description of the issue or feedback..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={createMutation.isPending}
                  onClick={submit}
                >
                  Create Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
