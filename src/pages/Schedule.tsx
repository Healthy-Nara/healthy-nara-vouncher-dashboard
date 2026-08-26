import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSchedule } from '../api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Schedule = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: ['schedule'],
    queryFn: () => fetchSchedule(),
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

  const formatDateKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

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
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayKey);
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        category="DUTY ALLOCATION"
        title="Schedule Calendar"
        subtitle="Manage master caregiver shift calendar and daily duty assignments."
        actions={
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="w-8 h-8 rounded-xl"
              >
                <ChevronLeft size={16} />
              </Button>
              <CardTitle>
                {MONTHS[month]} {year}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="w-8 h-8 rounded-xl"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Click a date to view shifts
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
                Loading duty schedule...
              </div>
            ) : (
              <div>
                {/* Day of week headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="px-2 py-2.5 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Matrix */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="h-24 bg-slate-50/30" />;
                    }

                    const dateKey = formatDateKey(day);
                    const dayItems = bookingsByDate[dateKey] || [];
                    const isTodayDate = dateKey === todayKey;
                    const isSelected = selectedDate === dateKey;

                    return (
                      <div
                        key={dateKey}
                        onClick={() => setSelectedDate(dateKey)}
                        className={`h-24 p-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/80 ring-2 ring-teal-500 ring-inset'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isTodayDate
                                ? 'bg-teal-500 text-white font-black shadow-xs'
                                : isSelected
                                ? 'text-teal-800 font-extrabold'
                                : 'text-slate-700'
                            }`}
                          >
                            {day}
                          </span>
                          {dayItems.length > 0 && (
                            <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded-md">
                              {dayItems.length}
                            </span>
                          )}
                        </div>

                        {/* Shift Badges Snippets */}
                        <div className="space-y-1 overflow-hidden">
                          {dayItems.slice(0, 2).map((item: any, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-700 shadow-xs"
                            >
                              {item.selectedCaregiver?.caregiverName || item.customerName}
                            </div>
                          ))}
                          {dayItems.length > 2 && (
                            <p className="text-[9px] font-extrabold text-teal-600 pl-1">
                              +{dayItems.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Details Sidebar Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {selectedDate
                  ? format(new Date(selectedDate), 'dd MMMM yyyy')
                  : 'Selected Date'}
              </CardTitle>
              <CardDescription>
                {selectedDate
                  ? `${selectedBookings.length} duty appointments`
                  : 'Select a day on the calendar'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedDate ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-2 p-6">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No date selected</p>
                <p className="text-xs text-slate-400">
                  Click on any day in the monthly calendar to inspect all shift assignments.
                </p>
              </div>
            ) : selectedBookings.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-2 p-6">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No shifts scheduled</p>
                <p className="text-xs text-slate-400">There are no duty bookings for this date.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {selectedBookings.map((b: any) => (
                  <div
                    key={b._id}
                    onClick={() => navigate(`/bookings/${b._id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs font-mono group-hover:text-teal-600 transition-colors">
                        {b.bookingNumber || `BK-${b._id.slice(-6).toUpperCase()}`}
                      </span>
                      <Badge variant="teal" dot>
                        {b.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar name={b.customerName || 'Customer'} size="xs" />
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{b.customerName}</p>
                        <p className="text-[10px] text-slate-400">{b.servicePackage || 'Newborn Care'}</p>
                      </div>
                    </div>

                    {b.selectedCaregiver && (
                      <div className="flex items-center justify-between pt-1 text-xs text-teal-800 bg-teal-50/60 p-2 rounded-xl border border-teal-100">
                        <span className="font-bold">Caregiver:</span>
                        <span className="font-extrabold">{b.selectedCaregiver.caregiverName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;
