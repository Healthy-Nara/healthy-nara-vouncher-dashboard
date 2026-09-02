import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancialReport } from '../api';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Calendar as CalendarIcon,
  ArrowDown,
  ReceiptText,
  Loader2,
  PieChart,
  BarChart3,
  EyeOff,
  X,
} from 'lucide-react';
import { DateRange, type Range, type RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useStatsToggle } from '../hooks/useStatsToggle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

export const BankReport = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom' | 'all'>('daily');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRangeSelection, setDateRangeSelection] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [tempDateRange, setTempDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [showStats, toggleStats] = useStatsToggle('bankreport');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeChange = (range: 'daily' | 'weekly' | 'monthly') => {
    setDateRange(range);
    const today = new Date();
    const fmtStr = (d: Date) => format(d, 'yyyy-MM-dd');
    if (range === 'daily') {
      setStartDate(fmtStr(today));
      setEndDate(fmtStr(today));
      const r = [{ startDate: today, endDate: today, key: 'selection' }];
      setDateRangeSelection(r);
      setTempDateRange(r);
    } else if (range === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      setStartDate(fmtStr(weekAgo));
      setEndDate(fmtStr(today));
      const r = [{ startDate: weekAgo, endDate: today, key: 'selection' }];
      setDateRangeSelection(r);
      setTempDateRange(r);
    } else {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmtStr(first));
      setEndDate(fmtStr(today));
      const r = [{ startDate: first, endDate: today, key: 'selection' }];
      setDateRangeSelection(r);
      setTempDateRange(r);
    }
  };

  const openDatePicker = () => {
    if (startDate && endDate) {
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      const current = [
        {
          startDate: new Date(sYear, sMonth - 1, sDay),
          endDate: new Date(eYear, eMonth - 1, eDay),
          key: 'selection',
        },
      ];
      setTempDateRange(current);
    } else {
      setTempDateRange(dateRangeSelection);
    }
    setShowDatePicker(true);
  };

  const handleDateRangeChange = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    setTempDateRange([selection]);
  };

  const applyPreset = (preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => {
    const today = new Date();
    if (preset === 'all') {
      const resetRange = [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
      setDateRangeSelection(resetRange);
      setTempDateRange(resetRange);
      setStartDate('');
      setEndDate('');
      setDateRange('all');
      setShowDatePicker(false);
      return;
    }

    let start = new Date(today);
    let end = new Date(today);

    if (preset === 'today') {
      start = today;
      end = today;
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = y;
      end = y;
    } else if (preset === 'thisWeek') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.getFullYear(), today.getMonth(), diff);
      end = new Date();
    } else if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date();
    }

    setTempDateRange([{ startDate: start, endDate: end, key: 'selection' }]);
  };

  const handleApplyDateRange = () => {
    const sel = tempDateRange[0];
    if (sel?.startDate && sel?.endDate) {
      setDateRangeSelection(tempDateRange);
      setStartDate(format(sel.startDate as Date, 'yyyy-MM-dd'));
      setEndDate(format(sel.endDate as Date, 'yyyy-MM-dd'));
      setDateRange('custom');
    }
    setShowDatePicker(false);
  };

  const handleClearDateFilter = () => {
    const defaultRange = [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
    setDateRangeSelection(defaultRange);
    setTempDateRange(defaultRange);
    setStartDate('');
    setEndDate('');
    setDateRange('all');
    setShowDatePicker(false);
  };

  const toApiDate = (d: string) => {
    if (!d) return '';
    if (d.includes('-') && d.split('-')[0].length === 4) return d;
    return d.split('-').reverse().join('-');
  };

  const { data: report, isLoading } = useQuery({
    queryKey: ['financial-report', startDate, endDate],
    queryFn: () =>
      fetchFinancialReport(toApiDate(startDate) || undefined, toApiDate(endDate) || undefined),
  });

  const summaryCards = useMemo(() => {
    if (!report) return [];
    return [
      {
        label: 'Total Income',
        value: report.totalIncome,
        icon: TrendingUp,
        color: 'text-emerald-700 bg-emerald-50',
      },
      {
        label: 'NA Payouts',
        value: report.totalPayouts,
        icon: ArrowDown,
        color: 'text-amber-700 bg-amber-50',
      },
      {
        label: 'Platform Fees',
        value: report.totalFees,
        icon: Wallet,
        color: 'text-teal-700 bg-teal-50',
      },
      {
        label: 'Total Expenses',
        value: report.totalExpenses,
        icon: ReceiptText,
        color: 'text-rose-700 bg-rose-50',
      },
      {
        label: 'Net Profit',
        value: report.netProfit,
        icon: report.netProfit >= 0 ? TrendingUp : TrendingDown,
        color:
          report.netProfit >= 0
            ? 'text-teal-700 bg-teal-50'
            : 'text-rose-700 bg-rose-50',
      },
    ];
  }, [report]);

  const channelList = useMemo(() => {
    if (!report?.channelBreakdown) return [];
    return Object.entries(report.channelBreakdown).map(([channel, data]: [string, any]) => ({
      channel,
      ...data,
    }));
  }, [report]);

  const dailyEntries = useMemo(() => {
    if (!report?.dailyData) return [];
    return Object.entries(report.dailyData).sort(([a], [b]) => b.localeCompare(a));
  }, [report]);

  const fmt = (n: number) => `${(n || 0).toLocaleString()} MMK`;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        category="FINANCIAL AUDIT"
        title="Bank Reconciliation Report"
        subtitle="Financial overview, income/expense breakdown, and bank payment channels."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={toggleStats}
            leftIcon={showStats ? <EyeOff size={14} /> : <BarChart3 size={14} />}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            title={showStats ? 'Hide filters & financial overview' : 'Show filters & financial overview'}
          >
            {showStats ? 'Hide Filters & Overview' : 'Show Filters & Overview'}
          </Button>
        }
      />

      {/* Date Filter Toolbar (Collapsible with overview) */}
      {showStats && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 shrink-0 animate-fadeIn relative z-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={() => handleRangeChange(range)}
                  className="capitalize text-xs rounded-xl"
                >
                  {range}
                </Button>
              ))}
            </div>

            {/* Date Range Picker Button */}
            <div className="flex items-center gap-1">
              <Button
                variant={startDate ? 'primary' : 'outline'}
                size="sm"
                onClick={openDatePicker}
                leftIcon={<CalendarIcon size={14} />}
                className="cursor-pointer"
              >
                {startDate
                  ? `${startDate} — ${endDate || startDate}`
                  : 'Date Range'}
              </Button>
              {startDate && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Clear date range filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5 Financial Summary Cards (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fadeIn">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className={`p-1.5 rounded-lg ${card.color}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                    {fmt(card.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Column Details: Channel Breakdown & Daily Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channel Breakdown Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Payment Channel Breakdown</CardTitle>
              <CardDescription>Collection across payment gateways and banks</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
                Calculating channel totals...
              </div>
            ) : channelList.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-2">
                <PieChart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No transactions in selected period</p>
              </div>
            ) : (
              <Table containerClassName="max-h-72 overflow-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>CHANNEL</TableHead>
                    <TableHead>INFLOW</TableHead>
                    <TableHead>OUTFLOW</TableHead>
                    <TableHead className="text-right">NET</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelList.map((c: any) => {
                    const net = (c.income || 0) - (c.payout || 0) - (c.expense || 0);
                    return (
                      <TableRow key={c.channel}>
                        <TableCell>
                          <Badge variant="teal" dot>
                            {c.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-emerald-700 font-mono">
                            +{fmt(c.income || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-rose-600 font-mono">
                            -{fmt((c.payout || 0) + (c.expense || 0))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-xs font-black font-mono ${
                              net >= 0 ? 'text-teal-700' : 'text-rose-600'
                            }`}
                          >
                            {fmt(net)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Daily Financial Log Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily Financial Log</CardTitle>
              <CardDescription>Day-by-day revenue & expenditure summary</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
                Loading daily breakdown...
              </div>
            ) : dailyEntries.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No data found</p>
              </div>
            ) : (
              <Table containerClassName="max-h-72 overflow-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>INCOME</TableHead>
                    <TableHead>EXPENSE/PAYOUT</TableHead>
                    <TableHead className="text-right">PROFIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyEntries.map(([dateKey, val]: [string, any]) => {
                    const net = (val.income || 0) - (val.payout || 0) - (val.expense || 0);
                    return (
                      <TableRow key={dateKey}>
                        <TableCell>
                          <span className="font-bold text-xs text-slate-800 font-mono">
                            {dateKey}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-emerald-700 font-mono">
                            {fmt(val.income || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-rose-600 font-mono">
                            {fmt((val.payout || 0) + (val.expense || 0))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-xs font-black font-mono ${
                              net >= 0 ? 'text-teal-700' : 'text-rose-600'
                            }`}
                          >
                            {fmt(net)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DATE RANGE MODAL */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            ref={datePickerRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-fadeIn max-h-[95vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Select Date Range</h4>
                  <p className="text-xs text-slate-400">Filter bank reports by date range</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick Presets</p>
              <div className="flex flex-wrap gap-1.5">
                <Button size="xs" variant="outline" onClick={() => applyPreset('today')}>
                  Today
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('yesterday')}>
                  Yesterday
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('thisWeek')}>
                  This Week
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('thisMonth')}>
                  This Month
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('all')}>
                  All Time
                </Button>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="overflow-x-auto flex justify-center bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
              <DateRange
                ranges={tempDateRange}
                onChange={handleDateRangeChange}
                rangeColors={['#14B8A6']}
                editableDateInputs={true}
                moveRangeOnFirstSelection={false}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600">
                {tempDateRange[0]?.startDate && tempDateRange[0]?.endDate
                  ? `${format(tempDateRange[0].startDate, 'yyyy-MM-dd')} to ${format(tempDateRange[0].endDate, 'yyyy-MM-dd')}`
                  : 'No date selected'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDateFilter}
                >
                  Clear Filter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyDateRange}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReport;
