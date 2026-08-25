import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminNAReports } from '../api';
import {
  FileText,
  Calendar,
  User,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';

const NAReports = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports, isLoading, refetch, isFetching } = useQuery({
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daily Care Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review daily activity logs and health care updates from Nurse Aids
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
            <span className="text-slate-400 font-normal">Total:</span>
            <span className="font-bold text-slate-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Submitted:</span>
            <span className="font-bold">{stats.submitted}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
            <Clock size={13} className="text-amber-600" />
            <span>In Progress:</span>
            <span className="font-bold">{stats.draft}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200/80">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by child or caregiver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Right: Date Picker, Status Filter, and Quick Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar size={16} className="text-[#1cb89b] shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold px-1"
                  title="Clear Date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick 'Today' Button */}
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-[#1cb89b] text-white border-transparent shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Today
            </button>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="draft">In Progress (Draft)</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
              title="Refresh Reports"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin h-8 w-8 text-[#1cb89b]" />
            <p className="text-sm font-medium text-slate-500">Loading daily care reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <FileText size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Daily Reports Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery || selectedDate || statusFilter
                ? 'No reports match your current filters. Try changing or clearing the filters.'
                : 'There are no daily care reports logged yet for this period.'}
            </p>
            {(searchQuery || selectedDate || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDate('');
                  setStatusFilter('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Assigned Nurse Aid</th>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Service Date</th>
                    <th className="px-6 py-3.5">Logged Entries</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Submission Time</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredReports.map((report: any) => {
                    const cName =
                      report.caregiver?.caregiverName ||
                      report.caregiverName ||
                      'Nurse Aid';
                    const customerName =
                      report.booking?.customerName ||
                      report.childName ||
                      'Customer';
                    const phone = report.booking?.phoneNumber;
                    const totalRecords = report.records?.length || 0;
                    const isSubmitted = report.status === 'submitted';

                    return (
                      <tr
                        key={report._id}
                        className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/na-reports/${report._id}`)}
                      >
                        {/* Nurse Aid */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-bold text-xs">
                              <User size={18} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block group-hover:text-primary transition-colors">
                                {cName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Caregiver
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Customer Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#1cb89b] flex items-center justify-center shrink-0">
                              <User size={15} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {customerName}
                              </span>
                              {phone && (
                                <span className="text-[11px] font-mono text-slate-500 block">
                                  {phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">
                            {formatDate(report.date)}
                          </span>
                        </td>

                        {/* Logged Activities Count */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                              {totalRecords} {totalRecords === 1 ? 'Log' : 'Logs'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              isSubmitted
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}
                          >
                            {isSubmitted ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <Clock size={13} className="text-amber-600" />
                            )}
                            {isSubmitted ? 'Submitted' : 'In Progress'}
                          </span>
                        </td>

                        {/* Submission Time */}
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {report.submittedAt ? formatTime(report.submittedAt) : '-'}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/na-reports/${report._id}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-[#1cb89b] hover:text-white hover:border-[#1cb89b] text-xs font-semibold transition-all shadow-2xs cursor-pointer group-hover:border-teal-300"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredReports.map((report: any) => {
                const cName =
                  report.caregiver?.caregiverName ||
                  report.caregiverName ||
                  'Nurse Aid';
                const customerName =
                  report.booking?.customerName ||
                  report.childName ||
                  'Customer';
                const phone = report.booking?.phoneNumber;
                const totalRecords = report.records?.length || 0;
                const isSubmitted = report.status === 'submitted';

                return (
                  <div
                    key={report._id}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col gap-3"
                    onClick={() => navigate(`/na-reports/${report._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {cName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-700 font-semibold">{customerName}</span>
                            {phone && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                ({phone})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isSubmitted
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {isSubmitted ? 'Submitted' : 'In Progress'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-medium">{formatDate(report.date)}</span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {totalRecords} Logged Entries
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NAReports;
