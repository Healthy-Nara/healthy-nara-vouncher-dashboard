import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../api';
import { format } from 'date-fns';
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Wallet,
  CalendarDays,
  Calendar as CalendarIcon,
  CreditCard,
  Tag,
  Loader2,
  BarChart3,
  EyeOff,
} from 'lucide-react';
import { DateRange, type Range, type RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useStatsToggle } from '../hooks/useStatsToggle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

const CATEGORIES = [
  'All',
  'Rent',
  'Utilities',
  'Salaries & Wages',
  'Transport',
  'Marketing',
  'Supplies',
  'Food & Drinks',
  'Equipment',
  'Other',
] as const;

const CHANNELS = ['KBZPay (Kpay)', 'AYAPay', 'WavePay', 'Cash', 'Bank', 'Other'] as const;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const toDateInput = (d: any) =>
  d ? new Date(d).toISOString().slice(0, 10) : '';

interface ExpenseForm {
  category: string;
  amount: string;
  paymentChannel: string;
  description: string;
  dateTime: string;
  note: string;
}

const emptyForm = (): ExpenseForm => ({
  category: 'Other',
  amount: '',
  paymentChannel: 'Cash',
  description: '',
  dateTime: todayStr(),
  note: '',
});

export const Expenses = () => {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showStats, toggleStats] = useStatsToggle('expenses');

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
      setTempDateRange(dateRange);
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
      setDateRange(resetRange);
      setTempDateRange(resetRange);
      setStartDate('');
      setEndDate('');
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
      setDateRange(tempDateRange);
      setStartDate(format(sel.startDate as Date, 'yyyy-MM-dd'));
      setEndDate(format(sel.endDate as Date, 'yyyy-MM-dd'));
    }
    setShowDatePicker(false);
  };

  const handleClearDateFilter = () => {
    const defaultRange = [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
    setDateRange(defaultRange);
    setTempDateRange(defaultRange);
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  const { data: expenses = [], isLoading } = useQuery<any[]>({
    queryKey: ['expenses'],
    queryFn: () => fetchExpenses(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['financial-report'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ExpenseForm) =>
      createExpense({ ...data, amount: Number(data.amount) }),
    onSuccess: () => {
      invalidateAll();
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseForm }) =>
      updateExpense(id, { ...data, amount: Number(data.amount) }),
    onSuccess: () => {
      invalidateAll();
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      invalidateAll();
      setDeleteConfirmId(null);
    },
  });

  const filteredExpenses = useMemo(() => {
    let list = expenses;
    if (categoryFilter !== 'All') {
      list = list.filter((e: any) => e.category === categoryFilter);
    }
    if (startDate && endDate) {
      list = list.filter((e: any) => {
        const d = toDateInput(e.dateTime);
        return d >= startDate && d <= endDate;
      });
    } else if (startDate) {
      list = list.filter((e: any) => toDateInput(e.dateTime) >= startDate);
    } else if (endDate) {
      list = list.filter((e: any) => toDateInput(e.dateTime) <= endDate);
    }
    return list;
  }, [expenses, categoryFilter, startDate, endDate]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0),
    [filteredExpenses]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (e: any) => {
    setEditingId(e._id);
    setForm({
      category: e.category || 'Other',
      amount: String(e.amount || ''),
      paymentChannel: e.paymentChannel || 'Cash',
      description: e.description || '',
      dateTime: toDateInput(e.dateTime) || todayStr(),
      note: e.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const formatMMK = (n: number) => `${(n || 0).toLocaleString()} MMK`;

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="FINANCIALS & ACCOUNTING"
          title="Operating Expenses"
          subtitle="Track company expenditures, operational costs, and payment channels."
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
                onClick={openCreate}
                leftIcon={<Plus size={16} />}
              >
                Add Expense
              </Button>
            </>
          }
        />
      </div>

      {/* 2 Metric Summary Cards (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-rose-600 tracking-tight">
                {formatMMK(totalExpenses)}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Expenses Recorded
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {expenses.length} Entries
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Transaction Records
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar (Collapsible with stats) */}
      {showStats && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 shrink-0 animate-fadeIn relative z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-teal-50 text-teal-800 border border-teal-200 font-bold'
                        : 'bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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

      {/* Expenses Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Wallet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No expenses recorded</p>
              <p className="text-xs text-slate-400">Add an expense or change category filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>PAYMENT CHANNEL</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((exp: any, index: number) => (
                      <TableRow key={exp._id}>
                        {/* Row Number */}
                        <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold w-12">
                          {index + 1}
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CalendarDays size={13} className="text-slate-400" />
                            <span>
                              {exp.dateTime
                                ? format(new Date(exp.dateTime), 'dd MMM yyyy')
                                : '—'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge variant="teal" dot>
                            {exp.category || 'Other'}
                          </Badge>
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {exp.description || '—'}
                            </p>
                            {exp.note && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{exp.note}</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Payment Channel */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <CreditCard size={13} className="text-slate-400" />
                            <span>{exp.paymentChannel || 'Cash'}</span>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell>
                          <span className="font-extrabold text-rose-600 font-mono text-xs">
                            {formatMMK(exp.amount)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(exp)}
                              className="w-7 h-7 text-slate-400 hover:text-slate-700"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(exp._id)}
                              className="w-7 h-7 text-slate-400 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {filteredExpenses.map((exp: any) => (
                  <div
                    key={exp._id}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="teal" dot>
                          {exp.category || 'Other'}
                        </Badge>
                        <p className="font-bold text-slate-900 text-sm mt-1">
                          {exp.description || 'Expense'}
                        </p>
                      </div>
                      <span className="font-black text-rose-600 font-mono text-sm">
                        -{formatMMK(exp.amount)}
                      </span>
                    </div>

                    {exp.note && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {exp.note}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                        <CreditCard size={11} className="text-slate-400" />
                        <span>{exp.paymentChannel || 'Cash'}</span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {exp.dateTime
                            ? format(new Date(exp.dateTime), 'dd MMM yyyy')
                            : '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(exp)}
                          className="w-7 h-7 text-slate-400 hover:text-slate-800"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(exp._id)}
                          className="w-7 h-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredExpenses.length} of ${expenses.length} records`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingId ? 'Edit Expense Record' : 'Record Operating Expense'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter expense category, amount, and payment channel
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (MMK) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Channel</label>
                  <select
                    value={form.paymentChannel}
                    onChange={(e) => setForm({ ...form, paymentChannel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={form.dateTime}
                    onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Office internet bill, staff transport..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  placeholder="Optional details..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Update Expense' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400">Filter expenses by transaction date</p>
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

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">Delete Expense?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this expense entry?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
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

export default Expenses;
