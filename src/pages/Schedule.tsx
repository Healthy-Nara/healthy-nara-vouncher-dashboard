import { useQuery } from '@tanstack/react-query';
import { fetchSchedule } from '../api';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, User, Package } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<string, string> = {
  'Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'Pending NA Selection': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
};

const Schedule = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const formatDateKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    bookings.forEach((booking: any) => {
      booking.requestedDates?.forEach((dateStr: string) => {
        const key = dateStr.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(booking);
      });
    });
    return map;
  }, [bookings]);

  const selectedBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd-MM');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Master duty calendar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
            <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-extrabold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map(day => (
              <div key={day} className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading schedule...</div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-100 bg-gray-50/50" />;
                const dateKey = formatDateKey(day);
                const dayBookings = bookingsByDate[dateKey] || [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-all hover:bg-primary/5 ${
                      isSelected ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${
                      isToday ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((b: any, i: number) => (
                        <div
                          key={i}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded truncate border ${
                            STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {b.caregiverName?.slice(0, 8) || b.customerName?.slice(0, 8)}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[9px] text-gray-400 font-medium">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Detail */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                {selectedDate ? formatDate(selectedDate) : 'Select a date'}
              </h2>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-0.5">{selectedBookings.length} assignment(s)</p>
              )}
            </div>
            <div className="p-5">
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Click on a date to view assignments</p>
                </div>
              ) : selectedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>No assignments on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedBookings.map((booking: any) => (
                    <div
                      key={booking._id}
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                      className="p-3 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{booking.bookingNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{booking.customerName}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                        {booking.caregiverName && (
                          <span className="inline-flex items-center gap-1">
                            <User size={10} />
                            {booking.caregiverName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Package size={10} />
                          {booking.dutyType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
