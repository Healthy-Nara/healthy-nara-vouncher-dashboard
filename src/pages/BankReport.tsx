import { useQuery } from '@tanstack/react-query';
import { fetchFinancialReport } from '../api';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, ArrowDown } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

const BankReport = () => {
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const toApiDate = (d: string) => d ? d.split('-').reverse().join('-') : '';

  const { data: report, isLoading } = useQuery({
    queryKey: ['financial-report', startDate, endDate],
    queryFn: () => fetchFinancialReport(toApiDate(startDate) || undefined, toApiDate(endDate) || undefined),
  });

  const summaryCards = useMemo(() => {
    if (!report) return [];
    return [
      { label: 'Total Income', value: report.totalIncome, icon: TrendingUp, color: 'bg-green-100 text-green-700', border: 'border-green-200' },
      { label: 'NA Payouts', value: report.totalPayouts, icon: ArrowDown, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
      { label: 'Platform Fees', value: report.totalFees, icon: Wallet, color: 'bg-primary/10 text-primary', border: 'border-primary/20' },
      { label: 'Net Profit', value: report.netProfit, icon: report.netProfit >= 0 ? TrendingUp : TrendingDown, color: report.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700', border: report.netProfit >= 0 ? 'border-emerald-200' : 'border-red-200' },
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
    return Object.entries(report.dailyData)
      .sort(([a], [b]) => b.localeCompare(a));
  }, [report]);

  const fmt = (n: number) => n?.toLocaleString() || '0';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bank Report</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview — payment channel breakdown</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as const).map(range => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                  dateRange === range
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <CustomDatePicker
              selected={startDate ? new Date(startDate.split('-').reverse().join('-')) : new Date()}
              onChange={(date) => setStartDate(format(date, 'dd-MM-yyyy'))}
            />
            <span className="text-xs text-gray-400">to</span>
            <CustomDatePicker
              selected={endDate ? new Date(endDate.split('-').reverse().join('-')) : new Date()}
              onChange={(date) => setEndDate(format(date, 'dd-MM-yyyy'))}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading report...</div>
      ) : !report ? (
        <div className="text-center py-12 text-gray-400">No data available</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(card => (
              <div key={card.label} className={`bg-white rounded-xl shadow-sm border ${card.border} p-5`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <card.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{card.label}</p>
                    <p className={`text-lg font-black ${card.color.split(' ')[1]}`}>{fmt(card.value)} MMK</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Payment Channel Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Channel</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Income</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">NA Payouts</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Platform Fees</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {channelList.map(ch => (
                    <tr key={ch.channel} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-bold text-gray-900">{ch.channel}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-700">{fmt(ch.income)} MMK</td>
                      <td className="px-5 py-3 text-right font-semibold text-orange-700">{fmt(ch.payouts)} MMK</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">{fmt(ch.fees)} MMK</td>
                      <td className="px-5 py-3 text-right text-gray-500">{ch.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td className="px-5 py-3 text-gray-900 uppercase text-xs">Total</td>
                    <td className="px-5 py-3 text-right text-green-700">{fmt(report.totalIncome)} MMK</td>
                    <td className="px-5 py-3 text-right text-orange-700">{fmt(report.totalPayouts)} MMK</td>
                    <td className="px-5 py-3 text-right text-primary">{fmt(report.totalFees)} MMK</td>
                    <td className="px-5 py-3 text-right text-gray-900">{report.paymentCount + report.payoutCount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Daily Trend */}
          {dailyEntries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Daily Breakdown</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {dailyEntries.map(([date, data]: [string, any]) => (
                  <div key={date} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{date}</p>
                        <p className="text-[10px] text-gray-400">Net: {fmt(data.income - data.payouts)} MMK</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-semibold">+{fmt(data.income)}</span>
                      <span className="text-orange-600 font-semibold">-{fmt(data.payouts)}</span>
                      <span className="text-primary font-semibold">Fees: {fmt(data.fees)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BankReport;
