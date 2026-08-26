import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvoices,
  deleteInvoice,
  updateCustomerPayment,
  updateCaregiverPayout,
} from '../api';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Receipt,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { DateRange, type Range, type RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';
import { Avatar } from '../components/ui/Avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

export const Invoices = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState({
    status: '',
    customerPaymentStatus: '',
    caregiverPayoutStatus: '',
    startDate: '',
    endDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const datePickerRef = useRef<HTMLDivElement>(null);

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

  const handleDateRangeChange = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    setDateRange([selection]);

    if (selection.startDate && selection.endDate) {
      setFilter({
        ...filter,
        startDate: format(selection.startDate, 'yyyy-MM-dd'),
        endDate: format(selection.endDate, 'yyyy-MM-dd'),
      });
    }
  };

  const resetFilters = () => {
    setFilter({
      status: '',
      customerPaymentStatus: '',
      caregiverPayoutStatus: '',
      startDate: '',
      endDate: '',
    });
    setDateRange([
      { startDate: new Date(), endDate: new Date(), key: 'selection' },
    ]);
  };

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['invoices', filter],
    queryFn: () => fetchInvoices(filter),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteConfirmId(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceNumber, data }: { invoiceNumber: string; data: any }) =>
      updateCustomerPayment(invoiceNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: ({ invoiceNumber, data }: { invoiceNumber: string; data: any }) =>
      updateCaregiverPayout(invoiceNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      const q = searchTerm.toLowerCase();
      return (
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.caregiverName?.toLowerCase().includes(q)
      );
    });
  }, [invoices, searchTerm]);

  // Totals calculations
  const totalAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [invoices]
  );
  const totalReceived = useMemo(
    () =>
      invoices
        .filter((inv) => inv.customerPaymentStatus === 'Received')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [invoices]
  );
  const totalPending = totalAmount - totalReceived;

  const formatMMK = (n: number) => `${n.toLocaleString()} MMK`;

  return (
    <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="FINANCIALS & BILLING"
          title="Invoices"
          subtitle="Manage customer invoices, receipts, and payment collection."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/create-invoice')}
              leftIcon={<Plus size={16} />}
            >
              Create Invoice
            </Button>
          }
        />
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {invoices.length}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Invoices
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 tracking-tight">
              {formatMMK(totalReceived)}
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Payments Received
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 tracking-tight">
              {formatMMK(totalPending)}
            </div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Pending Payments
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search invoice #, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filter.customerPaymentStatus}
                onChange={(e) =>
                  setFilter({ ...filter, customerPaymentStatus: e.target.value })
                }
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="">Customer Payment: All</option>
                <option value="Received">Received</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>

              <select
                value={filter.caregiverPayoutStatus}
                onChange={(e) =>
                  setFilter({ ...filter, caregiverPayoutStatus: e.target.value })
                }
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="">Caregiver Payout: All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Date Range Picker */}
              <div className="relative" ref={datePickerRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  leftIcon={<CalendarIcon size={14} />}
                >
                  {filter.startDate
                    ? `${filter.startDate} — ${filter.endDate}`
                    : 'Date Range'}
                </Button>

                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 animate-fadeIn">
                    <DateRange
                      ranges={dateRange}
                      onChange={handleDateRangeChange}
                      rangeColors={['#14B8A6']}
                    />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {(filter.status ||
                filter.customerPaymentStatus ||
                filter.caregiverPayoutStatus ||
                filter.startDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Invoices Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Invoices List</CardTitle>
            <CardDescription>
              {filteredInvoices.length} of {invoices.length} invoices
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No invoices found</p>
              <p className="text-xs text-slate-400">
                Create an invoice or change filter parameters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE #</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>CUSTOMER</TableHead>
                      <TableHead>CAREGIVER</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>PAYMENT</TableHead>
                      <TableHead>PAYOUT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv: any) => {
                      const isReceived = inv.customerPaymentStatus === 'Received';
                      const isPaid = inv.caregiverPayoutStatus === 'Paid';
                      const isCompleted = inv.status === 'Completed';

                      return (
                        <TableRow
                          key={inv._id}
                          onClick={() => navigate(`/invoice/${inv.invoiceNumber}`)}
                          className="cursor-pointer group"
                        >
                          {/* Invoice # */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs group-hover:text-teal-600 transition-colors">
                              {inv.invoiceNumber}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-xs text-slate-600">
                              {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}
                            </span>
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar name={inv.customerName || 'Customer'} size="xs" />
                              <span className="font-bold text-slate-800 text-xs">
                                {inv.customerName}
                              </span>
                            </div>
                          </TableCell>

                          {/* Caregiver */}
                          <TableCell>
                            <span className="text-xs text-slate-700">
                              {inv.caregiverName || '—'}
                            </span>
                          </TableCell>

                          {/* Amount */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs">
                              {formatMMK(inv.amount || 0)}
                            </span>
                          </TableCell>

                          {/* Payment Status */}
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                paymentMutation.mutate({
                                  invoiceNumber: inv.invoiceNumber,
                                  data: {
                                    customerPaymentStatus: isReceived ? 'Pending' : 'Received',
                                  },
                                });
                              }}
                              className="cursor-pointer"
                            >
                              <Badge variant={isReceived ? 'emerald' : 'amber'} dot>
                                {inv.customerPaymentStatus || 'Pending'}
                              </Badge>
                            </button>
                          </TableCell>

                          {/* Payout Status */}
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                payoutMutation.mutate({
                                  invoiceNumber: inv.invoiceNumber,
                                  data: {
                                    caregiverPayoutStatus: isPaid ? 'Pending' : 'Paid',
                                  },
                                });
                              }}
                              className="cursor-pointer"
                            >
                              <Badge variant={isPaid ? 'teal' : 'slate'} dot>
                                {inv.caregiverPayoutStatus || 'Pending'}
                              </Badge>
                            </button>
                          </TableCell>

                          {/* Total Status */}
                          <TableCell>
                            <Badge variant={isCompleted ? 'completed' : 'pending'} dot>
                              {inv.status || 'Pending'}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/invoice/${inv.invoiceNumber}`);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-700"
                                title="View Voucher"
                              >
                                <ChevronRight size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(inv._id);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-rose-600"
                                title="Delete Invoice"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {filteredInvoices.map((inv: any) => {
                  const isReceived = inv.customerPaymentStatus === 'Received';
                  const isPaid = inv.caregiverPayoutStatus === 'Paid';
                  const isCompleted = inv.status === 'Completed';

                  return (
                    <div
                      key={inv._id}
                      onClick={() => navigate(`/invoice/${inv.invoiceNumber}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Top Header: Inv # & Overall Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-xs">
                          {inv.invoiceNumber}
                        </span>
                        <Badge variant={isCompleted ? 'completed' : 'pending'} dot>
                          {inv.status || 'Pending'}
                        </Badge>
                      </div>

                      {/* Customer & Caregiver */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={inv.customerName || 'Customer'} size="xs" />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{inv.customerName}</p>
                            <p className="text-[10px] text-slate-400">
                              {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 font-mono">
                            {formatMMK(inv.amount || 0)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            CG: {inv.caregiverName || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Status Buttons & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              paymentMutation.mutate({
                                invoiceNumber: inv.invoiceNumber,
                                data: {
                                  customerPaymentStatus: isReceived ? 'Pending' : 'Received',
                                },
                              });
                            }}
                            className="cursor-pointer"
                          >
                            <Badge variant={isReceived ? 'emerald' : 'amber'} dot>
                              Pay: {inv.customerPaymentStatus || 'Pending'}
                            </Badge>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              payoutMutation.mutate({
                                invoiceNumber: inv.invoiceNumber,
                                data: {
                                  caregiverPayoutStatus: isPaid ? 'Pending' : 'Paid',
                                },
                              });
                            }}
                            className="cursor-pointer"
                          >
                            <Badge variant={isPaid ? 'teal' : 'slate'} dot>
                              Payout: {inv.caregiverPayoutStatus || 'Pending'}
                            </Badge>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(inv._id);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </Button>
                          <ChevronRight size={15} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">Delete Invoice?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this invoice?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
