import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminNAReports } from '../api';
import {
  FileText,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  Baby,
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

export const NAReports = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['adminNAReports', selectedDate, statusFilter],
    queryFn: () =>
      getAdminNAReports({
        date: selectedDate || undefined,
        status: statusFilter || undefined,
      }),
  });

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((r: any) => {
      const caregiverName = (
        r.caregiver?.caregiverName ||
        r.caregiverName ||
        ''
      ).toLowerCase();
      const childName = (r.childName || '').toLowerCase();
      const customerName = (r.booking?.customerName || '').toLowerCase();
      const phone = (r.booking?.phoneNumber || '').toLowerCase();
      return (
        caregiverName.includes(q) ||
        childName.includes(q) ||
        customerName.includes(q) ||
        phone.includes(q)
      );
    });
  }, [reports, searchQuery]);

  const stats = useMemo(() => {
    const list = reports || [];
    const submitted = list.filter((r: any) => r.status === 'submitted').length;
    const draft = list.filter((r: any) => r.status === 'draft').length;
    return { total: list.length, submitted, draft };
  }, [reports]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="CLINICAL & CARE LOGS"
          title="Daily Care Reports"
          subtitle="Review daily activity logs and health care updates submitted by Nurse Aids."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={
                <RefreshCw
                  size={14}
                  className={isFetching ? 'animate-spin text-teal-600' : ''}
                />
              }
            >
              Refresh
            </Button>
          }
        />
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Reports
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 tracking-tight">
              {stats.submitted}
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Submitted
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 tracking-tight">
              {stats.draft}
            </div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Drafting
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search caregiver, baby, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="">Status: All</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>

              {(selectedDate || statusFilter || searchQuery) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSelectedDate('');
                    setStatusFilter('');
                    setSearchQuery('');
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Care Activity Reports</CardTitle>
            <CardDescription>
              {filteredReports.length} reports logged for this period
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading nurse aid reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No care reports found</p>
              <p className="text-xs text-slate-400">Reports submitted by on-duty NAs will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CAREGIVER / NURSE AID</TableHead>
                      <TableHead>BABY & FAMILY</TableHead>
                      <TableHead>DUTY DATE</TableHead>
                      <TableHead>ACTIVITIES LOGGED</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((r: any) => {
                      const caregiverName =
                        r.caregiver?.caregiverName || r.caregiverName || 'Caregiver';
                      const childName = r.childName || 'Baby';
                      const customerName = r.booking?.customerName || 'Family';
                      const isSubmitted = r.status === 'submitted';
                      const activityCount =
                        (r.feedings?.length || 0) +
                        (r.sleeps?.length || 0) +
                        (r.diapers?.length || 0) +
                        (r.vitalSigns?.length || 0);

                      return (
                        <TableRow
                          key={r._id}
                          onClick={() => navigate(`/na-reports/${r._id}`)}
                          className="cursor-pointer group"
                        >
                          {/* Caregiver Name with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={caregiverName} size="xs" />
                              <div>
                                <p className="font-bold text-slate-900 text-xs group-hover:text-teal-600 transition-colors">
                                  {caregiverName}
                                </p>
                                <p className="text-[11px] text-slate-400">Nurse Aid</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Baby & Family */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Baby size={13} className="text-teal-600 shrink-0" />
                              <div>
                                <p className="font-bold text-slate-800 text-xs">{childName}</p>
                                <p className="text-[11px] text-slate-400">{customerName}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Duty Date */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{formatDate(r.date)}</span>
                            </div>
                          </TableCell>

                          {/* Activities Logged */}
                          <TableCell>
                            <span className="font-extrabold text-slate-800 text-xs font-mono">
                              {activityCount}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">logged items</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant={isSubmitted ? 'emerald' : 'amber'} dot>
                              {isSubmitted ? 'Submitted' : 'Drafting'}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/na-reports/${r._id}`);
                              }}
                              className="w-7 h-7 text-slate-400 hover:text-teal-600"
                              title="View report"
                            >
                              <ChevronRight size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {filteredReports.map((r: any) => {
                  const caregiverName =
                    r.caregiver?.caregiverName || r.caregiverName || 'Caregiver';
                  const childName = r.childName || 'Baby';
                  const customerName = r.booking?.customerName || 'Family';
                  const isSubmitted = r.status === 'submitted';
                  const activityCount =
                    (r.feedings?.length || 0) +
                    (r.sleeps?.length || 0) +
                    (r.diapers?.length || 0) +
                    (r.vitalSigns?.length || 0);

                  return (
                    <div
                      key={r._id}
                      onClick={() => navigate(`/na-reports/${r._id}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={caregiverName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {caregiverName}
                            </p>
                            <p className="text-[11px] text-slate-400">Nurse Aid</p>
                          </div>
                        </div>
                        <Badge variant={isSubmitted ? 'emerald' : 'amber'} dot>
                          {isSubmitted ? 'Submitted' : 'Drafting'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Baby size={13} className="text-teal-600" />
                          <span>{childName}</span>
                          <span className="text-slate-400 font-normal">({customerName})</span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-slate-800 font-mono">
                            {activityCount}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">items</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                          <Calendar size={11} className="text-slate-400" />
                          <span>{formatDate(r.date)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-teal-600 font-bold text-xs">
                          <span>View Report</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredReports.length} care reports`}
            updatedText="Real-time caregiver sync"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NAReports;
