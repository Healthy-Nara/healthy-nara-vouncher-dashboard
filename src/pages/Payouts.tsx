import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPayoutSummary } from '../api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Receipt,
  BarChart3,
  EyeOff,
} from 'lucide-react';
import { useStatsToggle } from '../hooks/useStatsToggle';
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

export const Payouts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [showStats, toggleStats] = useStatsToggle('payouts');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: fetchPayoutSummary,
  });

  const pendingInvoices = summary?.pending || [];
  const paidInvoices = summary?.paid || [];

  const displayList = useMemo(() => {
    const list = activeTab === 'pending' ? pendingInvoices : paidInvoices;
    if (!searchTerm) return list;
    const s = searchTerm.toLowerCase();
    return list.filter(
      (inv: any) =>
        inv.invoiceNumber?.toLowerCase().includes(s) ||
        inv.caregiverName?.toLowerCase().includes(s) ||
        inv.customerName?.toLowerCase().includes(s)
    );
  }, [activeTab, pendingInvoices, paidInvoices, searchTerm]);

  const tabItems = [
    { id: 'pending', label: 'Pending Payouts', count: pendingInvoices.length },
    { id: 'paid', label: 'Disbursed Payouts', count: paidInvoices.length },
  ];

  const formatMMK = (n: number) => `${(n || 0).toLocaleString()} MMK`;

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header matching reference image */}
      <div className="shrink-0">
        <PageHeader
          category="FINANCIALS & BILLING"
          title="Caregiver Payouts"
          subtitle="Manage caregiver disbursements, pay slips, and payout verification."
          actions={
            <>
              <Button
                variant="outline"
                size="md"
                onClick={toggleStats}
                leftIcon={showStats ? <EyeOff size={15} /> : <BarChart3 size={15} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                title={showStats ? 'Hide filters & summary statistics' : 'Show filters & summary statistics'}
              >
                {showStats ? 'Hide Filters & Stats' : 'Show Filters & Stats'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/update-payout')}
                leftIcon={<Banknote size={16} />}
              >
                Update Payout
              </Button>
            </>
          }
        />
      </div>

      {/* 2 Metric Summary Cards (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-amber-700 tracking-tight">
                {formatMMK(summary?.totalPending || 0)}
              </div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Pending Payout ({pendingInvoices.length} invoices)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-emerald-700 tracking-tight">
                {formatMMK(summary?.totalPaid || 0)}
              </div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Total Disbursed ({paidInvoices.length} invoices)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search (Collapsible with stats) */}
      {showStats && (
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <Tabs
            items={tabItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id)}
          />

          <div className="w-full md:w-72">
            <SearchInput
              placeholder="Search invoice, caregiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
        </div>
      )}

      {/* Payouts Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>
              {activeTab === 'pending' ? 'Pending Payouts' : 'Paid Invoices'}
            </CardTitle>
            <CardDescription>
              {displayList.length} caregiver payout records
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading payout data...
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No payout records found</p>
              <p className="text-xs text-slate-400">All caregiver dues are settled.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE #</TableHead>
                      <TableHead>CAREGIVER</TableHead>
                      <TableHead>CUSTOMER</TableHead>
                      <TableHead>SERVICE DATE</TableHead>
                      <TableHead>PAYOUT AMOUNT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayList.map((inv: any) => {
                      const isPaid = inv.caregiverPayoutStatus === 'Paid';
                      return (
                        <TableRow
                          key={inv._id}
                          onClick={() => navigate(`/update-payout/${inv.invoiceNumber}`)}
                          className="cursor-pointer group"
                        >
                          {/* Invoice # */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs group-hover:text-teal-600 transition-colors">
                              {inv.invoiceNumber}
                            </span>
                          </TableCell>

                          {/* Caregiver with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={inv.caregiverName || 'Caregiver'} size="xs" />
                              <span className="font-bold text-slate-800 text-xs">
                                {inv.caregiverName || '—'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <span className="text-xs text-slate-600">
                              {inv.customerName || '—'}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-xs text-slate-600">
                              {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}
                            </span>
                          </TableCell>

                          {/* Payout Amount */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs">
                              {formatMMK(inv.amount)}
                            </span>
                          </TableCell>

                          {/* Payout Status */}
                          <TableCell>
                            <Badge variant={isPaid ? 'teal' : 'amber'} dot>
                              {isPaid ? 'Paid' : 'Pending'}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/update-payout/${inv.invoiceNumber}`);
                              }}
                              className="w-7 h-7 text-slate-400 hover:text-teal-600"
                              title="Update Payout"
                            >
                              <ChevronRight size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {displayList.map((inv: any) => {
                  const isPaid = inv.caregiverPayoutStatus === 'Paid';
                  return (
                    <div
                      key={inv._id}
                      onClick={() => navigate(`/update-payout/${inv.invoiceNumber}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Top Row: Inv # & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-xs">
                          {inv.invoiceNumber}
                        </span>
                        <Badge variant={isPaid ? 'teal' : 'amber'} dot>
                          {isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>

                      {/* Caregiver & Client */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={inv.caregiverName || 'Caregiver'} size="xs" />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{inv.caregiverName}</p>
                            <p className="text-[10px] text-slate-400">Client: {inv.customerName}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 font-mono">
                            {formatMMK(inv.amount)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-xs text-teal-600 font-bold gap-1 pt-1 border-t border-slate-100/80">
                        <span>Update Payout</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${displayList.length} records`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Payouts;
