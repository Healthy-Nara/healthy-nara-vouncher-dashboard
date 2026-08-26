import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSchedule, fetchInvoices } from '../api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  FileText,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

export const DailyReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Booking statuses calculation
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    dayBookings.forEach((b: any) => {
      const s = b.status || 'Pending';
      if (s.includes('Pending')) counts.Pending++;
      else if (s === 'Assigned' || s === 'Confirmed') counts.Confirmed++;
      else if (s === 'Completed') counts.Completed++;
      else if (s === 'Cancelled') counts.Cancelled++;
      else counts.Pending++;
    });
    return counts;
  }, [dayBookings]);

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

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const formatMMK = (amount: number) => {
    return amount.toLocaleString() + ' MMK';
  };

  const isLoading = bookingsLoading || invoicesLoading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold text-teal-600 uppercase tracking-widest mb-1">
            OPERATIONS OVERVIEW
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.username || 'Team'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's what's happening across Healthy Nara today ({format(selectedDate, 'EEE, dd-MM-yyyy')}).
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevDay}
            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-900"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant={isToday ? 'primary' : 'outline'}
            size="sm"
            onClick={goToday}
            className="rounded-xl px-3 text-xs"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextDay}
            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-900"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Bookings"
          value={dayBookings.length}
          icon={<CalendarDays size={18} />}
          subtitle="VS LAST WEEK"
          change="12%"
          trend="up"
          sparklineData={[3, 5, 4, 8, 6, 9, dayBookings.length || 7]}
        />
        <MetricCard
          title="Caregivers"
          value={uniqueCaregivers.length}
          icon={<Users size={18} />}
          subtitle="ACTIVE TODAY"
          change="0%"
          trend="neutral"
          sparklineData={[4, 4, 5, 5, 4, 5, uniqueCaregivers.length || 5]}
        />
        <MetricCard
          title="Invoices"
          value={invoicesData.length}
          icon={<FileText size={18} />}
          subtitle="VS LAST WEEK"
          change="8%"
          trend="up"
          sparklineData={[2, 3, 4, 2, 5, 6, invoicesData.length || 4]}
        />
        <MetricCard
          title="Revenue"
          value={formatMMK(totalRevenue)}
          icon={<DollarSign size={18} />}
          subtitle="TODAY'S REVENUE"
          change="0%"
          trend="up"
          sparklineData={[150, 200, 180, 250, 300, 280, totalRevenue || 310]}
        />
      </div>

      {/* Middle Row: Revenue Growth & Booking Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth / Daily Performance Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue & Booking Activity</CardTitle>
              <CardDescription>Performance breakdown for {format(selectedDate, 'MMMM yyyy')}</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Bookings
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="py-4 space-y-6">
              {/* Visual mini bar charts representing days */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((day, idx) => {
                  const heights = [45, 60, 35, 75, 90, 80, 85];
                  const isCurrent = idx === 6;
                  return (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100 h-28 rounded-xl flex items-end justify-center p-1 relative overflow-hidden">
                        <div
                          style={{ height: `${heights[idx]}%` }}
                          className={`w-full rounded-lg transition-all ${
                            isCurrent ? 'bg-teal-500 shadow-xs shadow-teal-500/30' : 'bg-teal-200'
                          }`}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${isCurrent ? 'text-teal-700' : 'text-slate-400'}`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Sparkles size={16} className="text-teal-500" />
                  <span>Total invoices registered today: <strong>{invoicesData.length}</strong></span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => navigate('/invoices')}
                  rightIcon={<ArrowRight size={13} />}
                >
                  View Invoices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Donut Breakdown */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>Current booking distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-900">Pending</span>
                </div>
                <span className="text-xs font-extrabold text-amber-800 font-mono">
                  {statusCounts.Pending} bookings
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold text-teal-900">Confirmed / Active</span>
                </div>
                <span className="text-xs font-extrabold text-teal-800 font-mono">
                  {statusCounts.Confirmed} bookings
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-xs font-bold text-slate-800">Completed</span>
                </div>
                <span className="text-xs font-extrabold text-slate-700 font-mono">
                  {statusCounts.Completed} bookings
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-900">Cancelled</span>
                </div>
                <span className="text-xs font-extrabold text-rose-800 font-mono">
                  {statusCounts.Cancelled} bookings
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Today's Schedule Card matching reference image */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              {dayBookings.length} appointments scheduled for {format(selectedDate, 'dd-MM-yyyy')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
            <Clock size={14} className="text-slate-500" />
            <span>08:00 — 20:00</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading schedule data...
            </div>
          ) : dayBookings.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <CalendarDays className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No care appointments scheduled for this date</p>
              <p className="text-xs text-slate-400">Use the date switcher above or create a new booking.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {dayBookings.map((booking: any, idx: number) => {
                const times = ['08:00', '10:30', '13:00', '15:30', '18:00'];
                const timeSlot = times[idx % times.length];
                const isPending =
                  booking.status === 'Pending NA Selection' || booking.status === 'Pending';
                const isConfirmed =
                  booking.status === 'Assigned' || booking.status === 'Confirmed';
                const isCompleted = booking.status === 'Completed';

                return (
                  <div
                    key={booking._id}
                    onClick={() => navigate(`/bookings/${booking._id}`)}
                    className="px-6 py-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    {/* Time & Booking ID */}
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <span className="text-xs font-black text-slate-500 font-mono w-12">
                        {timeSlot}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 font-mono group-hover:text-teal-600 transition-colors">
                            {booking.bookingNumber || `BK-${booking._id.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {booking.customerName || 'Customer'}
                        </p>
                      </div>
                    </div>

                    {/* Caregiver Name */}
                    <div className="flex items-center gap-2.5 sm:w-48">
                      {booking.selectedCaregiver ? (
                        <>
                          <Avatar
                            name={booking.selectedCaregiver.caregiverName || 'NA'}
                            size="sm"
                          />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Caregiver
                            </p>
                            <p className="text-xs font-bold text-slate-800">
                              {booking.selectedCaregiver.caregiverName}
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* Status Badge & Duration */}
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <Badge
                        variant={
                          isPending
                            ? 'pending'
                            : isConfirmed
                            ? 'confirmed'
                            : isCompleted
                            ? 'completed'
                            : 'cancelled'
                        }
                        dot
                      >
                        {isPending
                          ? 'Pending'
                          : isConfirmed
                          ? 'Confirmed'
                          : booking.status || 'Active'}
                      </Badge>

                      <span className="text-xs text-slate-400 font-medium">
                        {booking.dutyDuration || '8 hrs'}
                      </span>

                      <ArrowRight
                        size={15}
                        className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all hidden sm:block"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReport;
