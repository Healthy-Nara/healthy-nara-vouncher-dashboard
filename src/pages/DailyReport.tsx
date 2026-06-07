import { useQuery } from '@tanstack/react-query';
import { fetchSchedule, fetchInvoices } from '../api';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, User, FileText, DollarSign } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Pending NA Selection': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  'Assigned':            { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Completed':           { color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  'Cancelled':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const DailyReport = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  const { data: invoicesData = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', dateKey, dateKey],
    queryFn: () => fetchInvoices({ startDate: dateKey, endDate: dateKey }),
  });

  const dayBookings = useMemo(() => {
    return allBookings.filter((b: any) =>
      b.requestedDates?.some((d: string) => d.slice(0, 10) === dateKey)
    );
  }, [allBookings, dateKey]);

  const uniqueCaregivers = useMemo(() => {
    const seen = new Set<string>();
    return dayBookings
      .filter((b: any) => {
        if (!b.selectedCaregiver?._id || seen.has(b.selectedCaregiver._id)) return false;
        seen.add(b.selectedCaregiver._id);
        return true;
      })
      .map((b: any) => b.selectedCaregiver);
  }, [dayBookings]);

  const totalRevenue = useMemo(() => {
    return invoicesData.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
  }, [invoicesData]);

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const goToday = () => setSelectedDate(new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatMMK = (amount: number) => {
    return amount.toLocaleString() + ' MMK';
  };

  const isLoading = bookingsLoading || invoicesLoading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Daily Report</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDate(selectedDate)}</p>
        </div>
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all">
            Today
          </button>
          <button onClick={nextDay} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Bookings</p>
              <p className="text-xl font-extrabold text-gray-900">{dayBookings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Caregivers</p>
              <p className="text-xl font-extrabold text-gray-900">{uniqueCaregivers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Invoices</p>
              <p className="text-xl font-extrabold text-gray-900">{invoicesData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Revenue</p>
              <p className="text-xl font-extrabold text-gray-900">{formatMMK(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={12} /> Bookings for Today ({dayBookings.length})
              </h2>
            </div>
            <div>
              {dayBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>No bookings for this date</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {dayBookings.map((booking: any) => {
                    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG['Pending NA Selection'];
                    return (
                      <div
                        key={booking._id}
                        onClick={() => navigate(`/bookings/${booking._id}`)}
                        className="px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{booking.bookingNumber}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                                {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{booking.customerName}</p>
                          </div>
                        </div>
                        {booking.selectedCaregiver && (
                          <div className="flex items-center gap-2 mt-2 pl-1">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {booking.selectedCaregiver.caregiverName?.charAt(0)}
                            </div>
                            <span className="text-xs text-primary font-medium">{booking.selectedCaregiver.caregiverName}</span>
                            {booking.selectedCaregiver.contactNumber && (
                              <a href={`tel:${booking.selectedCaregiver.contactNumber}`} onClick={e => e.stopPropagation()}
                                className="text-[10px] text-gray-400 hover:text-primary">📞</a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={12} /> Invoices for Today ({invoicesData.length})
              </h2>
            </div>
            <div>
              {invoicesData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>No invoices for this date</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {invoicesData.map((invoice: any) => (
                    <div
                      key={invoice._id}
                      onClick={() => navigate(`/invoice/${invoice.invoiceNumber}`)}
                      className="px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{invoice.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatMMK(invoice.amount)}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            invoice.customerPaymentStatus === 'Received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {invoice.customerPaymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
