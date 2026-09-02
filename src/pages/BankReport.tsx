import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancialReport } from '../api';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowDown,
  ReceiptText,
  Loader2,
  PieChart,
  BarChart3,
  EyeOff,
} from 'lucide-react';
import { useStatsToggle } from '../hooks/useStatsToggle';
import CustomDatePicker from '../components/CustomDatePicker';
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
  const todayStr = format(new Date(), 'dd-MM-yyyy');
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [showStats, toggleStats] = useStatsToggle('bankreport');

  const handleRangeChange = (range: 'daily' | 'weekly' | 'monthly') => {
    setDateRange(range);
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
        <Card className="animate-fadeIn">
          <CardContent className="p-4">
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

              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-slate-400" />
                <CustomDatePicker
                  selected={
                    startDate
                      ? new Date(startDate.split('-').reverse().join('-'))
                      : new Date()
                  }
                  onChange={(date) => setStartDate(format(date, 'dd-MM-yyyy'))}
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <CustomDatePicker
                  selected={
                    endDate ? new Date(endDate.split('-').reverse().join('-')) : new Date()
                  }
                  onChange={(date) => setEndDate(format(date, 'dd-MM-yyyy'))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
};

export default BankReport;
