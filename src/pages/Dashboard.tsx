import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';
import { format } from 'date-fns';
import CustomDatePicker from '../components/CustomDatePicker';
import {
  Clock,
  FileText,
  DollarSign,
  Activity,
  PhoneCall,
  Calendar,
  Waves,
  Mail,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleRangeChange = (range: 'all' | 'daily' | 'weekly' | 'monthly') => {
    setDateRange(range);
    if (range === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const today = new Date();
    const fmt = (d: Date) => format(d, 'dd-MM-yyyy');
    if (range === 'daily') {
      setStartDate(fmt(today));
      setEndDate(fmt(today));
    } else if (range === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      setStartDate(fmt(weekAgo));
      setEndDate(fmt(today));
    } else {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(first));
      setEndDate(fmt(today));
    }
  };

  const toApiDate = (d: string) => (d ? d.split('-').reverse().join('-') : '');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', startDate, endDate],
    queryFn: () =>
      fetchStats(toApiDate(startDate) || undefined, toApiDate(endDate) || undefined),
  });

  // Calculate totals and fallbacks
  const totalLeads = stats?.totalLeads ?? 7;
  const activeBookings = stats?.assignedBookings ?? 1;
  const totalInvoices = stats?.totalInvoices ?? 2;
  const totalRevenue = stats?.totalRevenue ?? 107000;
  const pendingPayments = stats?.pendingPayments ?? 107000;
  const accountsReceivable = stats?.accountsReceivable ?? 107000;
  const totalExpenses = stats?.totalExpenses ?? 100000;
  const activeNAs = stats?.activeNAs ?? 1;
  const totalPlatformFee = (stats as any)?.totalPlatformFee ?? 7000;
  const totalProfit = stats?.totalProfit ?? -93000;

  const newLeads = stats?.newLeads ?? 3;
  const contactedLeads = stats?.contactedLeads ?? 0;
  const saleClosedLeads = stats?.saleClosedLeads ?? 0;
  const activeCustomers = stats?.activeCustomers ?? 1;
  const lostLeads = stats?.lostLeads ?? 0;

  const draftInvoices = stats?.draftInvoices ?? 0;
  const createdInvoices = stats?.createdInvoices ?? 2;
  const sentInvoices = stats?.sentInvoices ?? 0;
  const confirmedInvoices = stats?.confirmedInvoices ?? 0;
  const completedInvoices = stats?.completedInvoices ?? 0;

  const pendingBookings = stats?.pendingBookings ?? 95;
  const completedBookings = stats?.completedBookings ?? 104;
  const totalBookings = stats?.totalBookings ?? 202;

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto pb-12">
      {/* 1. Top Filter Header Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Preset Tabs on the Left */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {(['all', 'daily', 'weekly', 'monthly'] as const).map((range) => {
            const label =
              range === 'all'
                ? 'All Time'
                : range === 'daily'
                ? 'Daily'
                : range === 'weekly'
                ? 'Weekly'
                : 'Monthly';
            const isActive = dateRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-[#0d6d5c] border border-teal-200/60 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                } disabled:opacity-50`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Date Pickers on the Right */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-40 sm:w-44">
            <CustomDatePicker
              selected={
                startDate ? new Date(startDate.split('-').reverse().join('-')) : new Date()
              }
              onChange={(date) => setStartDate(format(date, 'dd-MM-yyyy'))}
              placeholder="27-08-2026"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">to</span>
          <div className="w-40 sm:w-44">
            <CustomDatePicker
              selected={
                endDate ? new Date(endDate.split('-').reverse().join('-')) : new Date()
              }
              onChange={(date) => setEndDate(format(date, 'dd-MM-yyyy'))}
              placeholder="27-08-2026"
            />
          </div>
        </div>
      </div>

      {/* 2. Metric Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 - Card 1: TOTAL LEADS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60">
              <PhoneCall size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL LEADS
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalLeads}</p>
            </div>
          </div>
        </div>

        {/* Row 1 - Card 2: ACTIVE BOOKINGS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE BOOKINGS
              </p>
              <p className="text-2xl font-black text-blue-600 mt-0.5">{activeBookings}</p>
            </div>
          </div>
        </div>

        {/* Row 1 - Card 3: TOTAL INVOICES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL INVOICES
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-0.5">{totalInvoices}</p>
            </div>
          </div>
        </div>

        {/* Row 1 - Card 4: TOTAL REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/60">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL REVENUE
              </p>
              <p className="text-xl font-black text-teal-600 mt-0.5">
                {totalRevenue.toLocaleString()} <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
          <Waves size={24} className="text-teal-300/80 shrink-0" />
        </div>

        {/* Row 2 - Card 5: PENDING PAYMENTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/60">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                PENDING PAYMENTS
              </p>
              <p className="text-xl font-black text-rose-500 mt-0.5">
                {pendingPayments.toLocaleString()}{' '}
                <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2 - Card 6: ACCOUNTS RECEIVABLE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ACCOUNTS RECEIVABLE
              </p>
              <p className="text-xl font-black text-amber-600 mt-0.5">
                {accountsReceivable.toLocaleString()}{' '}
                <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2 - Card 7: TOTAL EXPENSES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/60">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL EXPENSES
              </p>
              <p className="text-xl font-black text-rose-500 mt-0.5">
                {totalExpenses.toLocaleString()}{' '}
                <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2 - Card 8: ACTIVE NAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/60">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE NAS
              </p>
              <p className="text-2xl font-black text-teal-600 mt-0.5">{activeNAs}</p>
            </div>
          </div>
        </div>

        {/* Row 3 - Card 9: TOTAL PLATFORM FEE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100/60">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL PLATFORM FEE
              </p>
              <p className="text-xl font-black text-sky-600 mt-0.5">
                {totalPlatformFee.toLocaleString()}{' '}
                <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 3 - Card 10: TOTAL PROFIT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL PROFIT
              </p>
              <p className="text-xl font-black text-purple-600 mt-0.5">
                {totalProfit.toLocaleString()}{' '}
                <span className="text-sm font-extrabold">MMK</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Charts Section (Revenue vs Expenses & Booking Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Revenue vs Expenses (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Revenue vs Expenses
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">30-day trend</p>
          </div>

          <div className="mt-6 w-full h-[260px]">
            <RevenueExpenseTrendChart />
          </div>
        </div>

        {/* Right Chart: Booking Status Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Booking Status
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Current lifecycle mix</p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Donut Chart */}
            <div className="w-48 h-48 shrink-0 flex items-center justify-center relative">
              <BookingStatusDonutChart
                pending={pendingBookings}
                assigned={activeBookings}
                completed={completedBookings}
              />
            </div>

            {/* Right Side Stats & Legend */}
            <div className="flex-1 w-full space-y-4">
              <div className="bg-slate-50/80 rounded-2xl p-4 text-center border border-slate-100/80">
                <p className="text-3xl font-black text-slate-900">{totalBookings}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  TOTAL
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                    <span className="text-slate-600">Pending NA</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{pendingBookings}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                    <span className="text-slate-600">Assigned</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{activeBookings}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                    <span className="text-slate-600">Completed</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{completedBookings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle 3-Column Summary Cards (Lead Pipeline, Invoice Status, Booking Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: LEAD PIPELINE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-5">
            LEAD PIPELINE
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-slate-800">New</span>
              </div>
              <span className="font-extrabold text-emerald-600 text-sm">{newLeads}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-800">Contacted</span>
              </div>
              <span className="font-extrabold text-amber-600 text-sm">{contactedLeads}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-bold text-slate-800">Sale Closed</span>
              </div>
              <span className="font-extrabold text-blue-600 text-sm">{saleClosedLeads}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span className="font-bold text-slate-800">Active Customer</span>
              </div>
              <span className="font-extrabold text-rose-600 text-sm">{activeCustomers}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-bold text-slate-800">Lost</span>
              </div>
              <span className="font-extrabold text-rose-500 text-sm">{lostLeads}</span>
            </div>
          </div>
        </div>

        {/* Card 2: INVOICE STATUS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-5">
            INVOICE STATUS
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-slate-400">
                <FileText size={16} />
                <span className="font-bold text-slate-800">Draft</span>
              </div>
              <span className="font-extrabold text-slate-600 text-sm">{draftInvoices}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-blue-500">
                <FileText size={16} />
                <span className="font-bold text-slate-800">Created</span>
              </div>
              <span className="font-extrabold text-blue-600 text-sm">{createdInvoices}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-amber-500">
                <Clock size={16} />
                <span className="font-bold text-slate-800">Sent</span>
              </div>
              <span className="font-extrabold text-amber-600 text-sm">{sentInvoices}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-teal-500">
                <DollarSign size={16} />
                <span className="font-bold text-slate-800">Payment Confirmed</span>
              </div>
              <span className="font-extrabold text-teal-600 text-sm">{confirmedInvoices}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-emerald-500">
                <TrendingUp size={16} />
                <span className="font-bold text-slate-800">Completed</span>
              </div>
              <span className="font-extrabold text-emerald-600 text-sm">{completedInvoices}</span>
            </div>
          </div>
        </div>

        {/* Card 3: BOOKING SUMMARY (2x2 Grid) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
            BOOKING SUMMARY
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Top Left: Pending NA */}
            <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">
                {pendingBookings}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">Pending NA</p>
            </div>

            {/* Top Right: Assigned */}
            <div className="bg-sky-50/70 border border-sky-100/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl sm:text-3xl font-black text-sky-600">{activeBookings}</p>
              <p className="text-xs font-bold text-slate-500 mt-1">Assigned</p>
            </div>

            {/* Bottom Left: Completed */}
            <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                {completedBookings}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">Completed</p>
            </div>

            {/* Bottom Right: Total */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalBookings}</p>
              <p className="text-xs font-bold text-slate-500 mt-1">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Full-Width Chart: Caregiver Activity */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Caregiver Activity
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Active vs Inactive NAs this month
          </p>
        </div>

        <div className="w-full h-[280px]">
          <CaregiverActivityBarChart />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-2 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
            <span className="text-slate-700">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-slate-700">On Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
            <span className="text-slate-700">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SVG CHART 1: REVENUE VS EXPENSES TREND AREA CHART
// ============================================================================
const RevenueExpenseTrendChart = () => {
  // 30-day simulated points matching screenshot curve
  // Width: 600, Height: 240
  // Y: 0k=220, 30k=175, 60k=130, 90k=85, 120k=40
  const dates = ['Jul 29', 'Aug 03', 'Aug 08', 'Aug 13', 'Aug 18', 'Aug 23', 'Aug 27'];

  // Smooth spline coordinates
  // Revenue (Teal): Starts at ~25k, climbs smoothly to ~107k
  const revPath =
    'M 40 185 C 80 160, 110 165, 150 170 C 190 175, 230 145, 270 130 C 320 115, 370 95, 420 80 C 470 65, 520 48, 560 42';
  const revArea = `${revPath} L 560 220 L 40 220 Z`;

  // Expense (Coral/Red): Starts at ~15k, climbs smoothly to ~100k
  const expPath =
    'M 40 200 C 90 190, 140 185, 180 180 C 220 175, 260 160, 300 148 C 350 135, 400 125, 450 110 C 490 95, 530 65, 560 48';
  const expArea = `${expPath} L 560 220 L 40 220 Z`;

  return (
    <svg
      viewBox="0 0 600 240"
      className="w-full h-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Teal Gradient for Revenue */}
        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.01" />
        </linearGradient>

        {/* Rose Gradient for Expenses */}
        <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Dotted Grid Horizontal Lines */}
      <line
        x1="40"
        y1="40"
        x2="570"
        y2="40"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="44" textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
        120k
      </text>

      <line
        x1="40"
        y1="85"
        x2="570"
        y2="85"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="89" textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
        90k
      </text>

      <line
        x1="40"
        y1="130"
        x2="570"
        y2="130"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="134" textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
        60k
      </text>

      <line
        x1="40"
        y1="175"
        x2="570"
        y2="175"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="179" textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
        30k
      </text>

      <line
        x1="40"
        y1="220"
        x2="570"
        y2="220"
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="224" textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
        0k
      </text>

      {/* Shaded Areas */}
      <path d={expArea} fill="url(#roseGrad)" />
      <path d={revArea} fill="url(#tealGrad)" />

      {/* Smooth Curve Lines */}
      <path
        d={expPath}
        fill="none"
        stroke="#f43f5e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d={revPath}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* X Axis Labels */}
      {dates.map((date, i) => {
        const x = 40 + i * ((560 - 40) / (dates.length - 1));
        return (
          <text
            key={i}
            x={x}
            y="238"
            textAnchor="middle"
            className="text-[10px] fill-slate-400 font-medium font-sans"
          >
            {date}
          </text>
        );
      })}
    </svg>
  );
};

// ============================================================================
// SVG CHART 2: BOOKING STATUS DONUT CHART
// ============================================================================
const BookingStatusDonutChart = ({
  pending,
  assigned,
  completed,
}: {
  pending: number;
  assigned: number;
  completed: number;
}) => {
  const total = (pending + assigned + completed) || 1;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  // Fraction percentages
  const pFrac = pending / total;
  const aFrac = assigned / total;
  const cFrac = completed / total;

  // Stroke Dasharray calculations
  const pDash = `${pFrac * circumference} ${circumference}`;
  const aDash = `${aFrac * circumference} ${circumference}`;
  const cDash = `${cFrac * circumference} ${circumference}`;

  // Offsets
  const pOffset = 0;
  const aOffset = -pFrac * circumference;
  const cOffset = -(pFrac + aFrac) * circumference;

  return (
    <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
      {/* Background ring */}
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#f8fafc"
        strokeWidth="26"
      />

      {/* Pending NA (Yellow/Amber) */}
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#eab308"
        strokeWidth="26"
        strokeDasharray={pDash}
        strokeDashoffset={pOffset}
        className="transition-all duration-700 ease-out"
      />

      {/* Assigned (Sky/Blue) */}
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#0284c7"
        strokeWidth="26"
        strokeDasharray={aDash}
        strokeDashoffset={aOffset}
        className="transition-all duration-700 ease-out"
      />

      {/* Completed (Teal/Emerald) */}
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#0d9488"
        strokeWidth="26"
        strokeDasharray={cDash}
        strokeDashoffset={cOffset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

// ============================================================================
// SVG CHART 3: CAREGIVER ACTIVITY GROUPED BAR CHART
// ============================================================================
const CaregiverActivityBarChart = () => {
  // Weekly data series matching screenshot
  // Max Y: 16 (y=30), 12 (y=80), 8 (y=130), 4 (y=180), 0 (y=230)
  const weeks = [
    { label: 'Week 1', active: 12, onLeave: 2, inactive: 4 },
    { label: 'Week 2', active: 14, onLeave: 1, inactive: 3 },
    { label: 'Week 3', active: 11, onLeave: 3, inactive: 5 },
    { label: 'Week 4', active: 16, onLeave: 2, inactive: 2 },
  ];

  const yZero = 230;
  const scale = (yZero - 30) / 16; // pixels per unit

  return (
    <svg
      viewBox="0 0 700 260"
      className="w-full h-full overflow-visible"
      preserveAspectRatio="none"
    >
      {/* Horizontal Dotted Grid Lines */}
      <line
        x1="40"
        y1="30"
        x2="680"
        y2="30"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="34" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">
        16
      </text>

      <line
        x1="40"
        y1="80"
        x2="680"
        y2="80"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="84" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">
        12
      </text>

      <line
        x1="40"
        y1="130"
        x2="680"
        y2="130"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="134" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">
        8
      </text>

      <line
        x1="40"
        y1="180"
        x2="680"
        y2="180"
        stroke="#f1f5f9"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="184" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">
        4
      </text>

      <line
        x1="40"
        y1="230"
        x2="680"
        y2="230"
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="30" y="234" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">
        0
      </text>

      {/* Grouped Bars */}
      {weeks.map((w, i) => {
        // Center position for this week group
        const groupCenterX = 100 + i * 160;
        const barW = 28;
        const gap = 3;

        const activeH = w.active * scale;
        const leaveH = w.onLeave * scale;
        const inactH = w.inactive * scale;

        const activeX = groupCenterX - barW - gap - barW / 2;
        const leaveX = groupCenterX - barW / 2;
        const inactX = groupCenterX + barW / 2 + gap;

        return (
          <g key={i}>
            {/* Active Bar (Teal) */}
            <rect
              x={activeX}
              y={yZero - activeH}
              width={barW}
              height={activeH}
              rx="4"
              fill="#0d9488"
              className="transition-all hover:opacity-80 cursor-pointer"
            />

            {/* On Leave Bar (Orange) */}
            <rect
              x={leaveX}
              y={yZero - leaveH}
              width={barW}
              height={leaveH}
              rx="4"
              fill="#f59e0b"
              className="transition-all hover:opacity-80 cursor-pointer"
            />

            {/* Inactive Bar (Slate/Gray) */}
            <rect
              x={inactX}
              y={yZero - inactH}
              width={barW}
              height={inactH}
              rx="4"
              fill="#94a3b8"
              className="transition-all hover:opacity-80 cursor-pointer"
            />

            {/* Week Label */}
            <text
              x={groupCenterX}
              y="248"
              textAnchor="middle"
              className="text-[11px] fill-slate-400 font-medium font-sans"
            >
              {w.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default Dashboard;
