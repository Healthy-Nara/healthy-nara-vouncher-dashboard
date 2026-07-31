import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../api';
import { useState, useMemo } from 'react';
import { Plus, X, Trash2, Pencil, Wallet, CalendarDays } from 'lucide-react';

const CATEGORIES = [
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

const Expenses = () => {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
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

  const totalExpenses = useMemo(
    () => expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (categoryFilter !== 'All') {
      result = result.filter((e: any) => e.category === categoryFilter);
    }
    if (dateFilter) {
      result = result.filter(
        (e: any) =>
          e.dateTime && toDateInput(e.dateTime) === dateFilter,
      );
    }
    return result;
  }, [expenses, categoryFilter, dateFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (e: any) => {
    setEditingId(e._id);
    setForm({
      category: e.category,
      amount: String(e.amount || ''),
      paymentChannel: e.paymentChannel || 'Cash',
      description: e.description || '',
      dateTime: toDateInput(e.dateTime),
      note: e.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.amount) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">{expenses.length} total expenses</p>
        </div>
        <button
          onClick={openCreate}
          className="hidden md:inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all"
        >
          <Plus size={16} /> New Expense
        </button>
      </div>

      {/* Summary + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-black text-gray-900">{totalExpenses.toLocaleString()} MMK</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No expenses found</p>
          <button onClick={openCreate} className="mt-3 text-primary text-sm font-bold hover:underline">
            + Add your first expense
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredExpenses.map((e: any) => (
              <div key={e._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                      {e.category}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm mt-1">
                      {e.description || e.category}
                    </h3>
                    <p className="text-lg font-black text-red-600 mt-1">
                      {Number(e.amount || 0).toLocaleString()} MMK
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <CalendarDays size={10} />
                        {toDateInput(e.dateTime)}
                      </span>
                      <span className="text-[10px] text-gray-400">{e.paymentChannel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(e._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {e.note && <p className="text-xs text-gray-500 mt-2">{e.note}</p>}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Channel</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((e: any) => (
                    <tr key={e._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{e.description || e.category}</span>
                        {e.note && <p className="text-xs text-gray-500 truncate max-w-[220px] mt-0.5">{e.note}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-red-600">
                        {Number(e.amount || 0).toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{e.paymentChannel}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{toDateInput(e.dateTime)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(e._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={openCreate}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-primary-dark hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus size={24} />
      </button>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 md:duration-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">{editingId ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Amount (MMK) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Payment Channel</label>
                  <select
                    value={form.paymentChannel}
                    onChange={e => setForm({ ...form, paymentChannel: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  >
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={form.dateTime}
                    onChange={e => setForm({ ...form, dateTime: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Monthly rent, transport fee..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">Note</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  placeholder="အသေးစိတ်မှတ်စု..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.amount || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2.5 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingId ? 'Save Changes' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all py-2.5 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
