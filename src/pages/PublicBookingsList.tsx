import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../api';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, ChevronRight, Calendar, Package, User } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Pending NA Selection': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  'Assigned':            { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Completed':           { color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  'Cancelled':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const PublicBookingsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetchBookings(),
  });

  // Filter only No-Auth / Public Bookings (bookings created from public client that have a bookingToken)
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
      result = result.filter((b: any) =>
        b.bookingNumber?.toLowerCase().includes(s) ||
        b.customerName?.toLowerCase().includes(s) ||
        b.phoneNumber?.includes(s)
      );
    }
    return result;
  }, [publicBookings, searchTerm, statusFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), 'dd-MM-yyyy');
  };



  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Public Bookings (No-Auth)</h1>
        <p className="text-sm text-gray-500 mt-1">{publicBookings.length} bookings submitted via public forms</p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking #, customer name, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Pending NA Selection', 'Assigned', 'Completed', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No public bookings found matching filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredBookings.map((booking: any) => {
            const statusConfig = STATUS_CONFIG[booking.status] || { color: 'text-gray-700', bg: 'bg-gray-100', icon: '❓' };
            return (
              <div
                key={booking._id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/50 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div
                  onClick={() => navigate(`/bookings/${booking._id}`)}
                  className="flex-grow cursor-pointer space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-extrabold text-gray-900">
                      {booking.bookingNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                      <span>{statusConfig.icon}</span>
                      <span>{booking.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-gray-400" />
                      <span className="font-semibold text-gray-700">{booking.customerName}</span>
                      <span className="text-[10px] text-gray-400">({booking.phoneNumber})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package size={13} className="text-gray-400" />
                      <span>{booking.servicePackage} ({booking.dutyShift})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      <span>Starts: {booking.requestedDates?.[0] ? formatDate(booking.requestedDates[0]) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => navigate(`/bookings/${booking._id}`)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-700"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicBookingsList;
