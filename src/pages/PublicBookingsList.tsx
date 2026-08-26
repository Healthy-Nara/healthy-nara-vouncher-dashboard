import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Globe,
  Loader2,
  ChevronRight,
  Phone,
  Calendar,
} from 'lucide-react';
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

const STATUS_TABS = [
  { id: 'All', label: 'All Inquiries' },
  { id: 'Pending NA Selection', label: 'Pending Selection' },
  { id: 'Assigned', label: 'Assigned' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export const PublicBookingsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const { data: allBookings = [], isLoading } = useQuery<any[]>({
    queryKey: ['bookings'],
    queryFn: () => fetchBookings(),
  });

  // Filter only No-Auth / Public Bookings
  const publicBookings = useMemo(() => {
    return allBookings.filter((b: any) => b.bookingToken);
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    let result = publicBookings;
    if (statusFilter !== 'All') {
      result = result.filter((b: any) => b.status === statusFilter);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (b: any) =>
          b.bookingNumber?.toLowerCase().includes(s) ||
          b.customerName?.toLowerCase().includes(s) ||
          b.phoneNumber?.includes(s)
      );
    }
    return result;
  }, [publicBookings, searchTerm, statusFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'dd-MM-yyyy');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assigned':
        return <Badge variant="teal" dot>Assigned</Badge>;
      case 'Completed':
        return <Badge variant="emerald" dot>Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="rose" dot>Cancelled</Badge>;
      default:
        return <Badge variant="amber" dot>Pending Selection</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="ONLINE INQUIRIES"
          title="Public Web Bookings"
          subtitle="Customer bookings submitted via public landing and token forms."
        />
      </div>

      {/* Tabs and Search Bar */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          items={STATUS_TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count:
              tab.id === 'All'
                ? publicBookings.length
                : publicBookings.filter((b: any) => b.status === tab.id).length,
          }))}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id)}
        />

        <div className="w-full md:w-72">
          <SearchInput
            placeholder="Search booking #, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Public Form Submissions</CardTitle>
            <CardDescription>
              {filteredBookings.length} of {publicBookings.length} bookings
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading public bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Globe className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No public bookings found</p>
              <p className="text-xs text-slate-400">Share your public link to receive client bookings.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BOOKING ID</TableHead>
                      <TableHead>CLIENT NAME</TableHead>
                      <TableHead>PACKAGE & SHIFT</TableHead>
                      <TableHead>REQUESTED DATES</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((b: any) => (
                      <TableRow
                        key={b._id}
                        onClick={() => navigate(`/bookings/${b._id}`)}
                        className="cursor-pointer group"
                      >
                        {/* Booking ID */}
                        <TableCell>
                          <span className="font-extrabold text-slate-900 font-mono text-xs group-hover:text-teal-600 transition-colors">
                            {b.bookingNumber || `BK-${b._id.slice(-6).toUpperCase()}`}
                          </span>
                        </TableCell>

                        {/* Client Name with Avatar */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={b.customerName || 'Customer'} size="xs" />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{b.customerName}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                <span>{b.phoneNumber || '—'}</span>
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Package */}
                        <TableCell>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {b.servicePackage || 'Newborn Care'}
                            </p>
                            <p className="text-[11px] text-slate-400">{b.dutyShift || '24 Hours'}</p>
                          </div>
                        </TableCell>

                        {/* Dates */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar size={12} className="text-slate-400" />
                            <span>
                              {b.requestedDates && b.requestedDates[0]
                                ? formatDate(b.requestedDates[0])
                                : '—'}
                              {b.requestedDates?.length > 1
                                ? ` (+${b.requestedDates.length - 1} days)`
                                : ''}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>{getStatusBadge(b.status)}</TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bookings/${b._id}`);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-teal-600"
                            title="View details"
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
                {filteredBookings.map((b: any) => (
                  <div
                    key={b._id}
                    onClick={() => navigate(`/bookings/${b._id}`)}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {b.bookingNumber || `BK-${b._id.slice(-6).toUpperCase()}`}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Avatar name={b.customerName || 'Customer'} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">
                          {b.customerName}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />
                          <span>{b.phoneNumber || '—'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          {b.servicePackage || 'Newborn Care'}
                        </p>
                        <p className="text-[10px] text-slate-400">{b.dutyShift || '24 Hours'}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 font-medium">
                        {b.requestedDates && b.requestedDates[0]
                          ? formatDate(b.requestedDates[0])
                          : '—'}
                        {b.requestedDates?.length > 1
                          ? ` (+${b.requestedDates.length - 1}d)`
                          : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-end text-xs text-teal-600 font-bold gap-1 pt-0.5">
                      <span>View Submission</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredBookings.length} entries`}
            updatedText="Syncing with web inquiries"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicBookingsList;
