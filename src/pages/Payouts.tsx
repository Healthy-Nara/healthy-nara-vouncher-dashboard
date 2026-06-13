import { useQuery } from '@tanstack/react-query';
import { fetchPayoutSummary } from '../api';
import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle, Clock, ExternalLink, Search } from 'lucide-react';

const Payouts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: fetchPayoutSummary,
  });

  const pendingInvoices = summary?.pending || [];
  const paidInvoices = summary?.paid || [];

  const filterList = (list: any[]) => {
    if (!searchTerm) return list;
    const s = searchTerm.toLowerCase();
    return list.filter((inv: any) =>
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.caregiverName?.toLowerCase().includes(s) ||
      inv.customerName?.toLowerCase().includes(s)
    );
  };

  const displayList = filterList(activeTab === 'pending' ? pendingInvoices : paidInvoices);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">NA (Caregiver) payment management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Pending Payout</p>
              <p className="text-2xl font-black text-orange-600">{summary?.totalPending?.toLocaleString() || 0} MMK</p>
              <p className="text-xs text-gray-400">{pendingInvoices.length} invoice(s)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Paid</p>
              <p className="text-2xl font-black text-green-600">{summary?.totalPaid?.toLocaleString() || 0} MMK</p>
              <p className="text-xs text-gray-400">{paidInvoices.length} invoice(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto md:hidden">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              activeTab === 'pending'
                ? 'bg-orange-100 text-orange-700 border-orange-300'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            <Clock size={12} className="inline mr-1" />
            Pending ({pendingInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              activeTab === 'paid'
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            <CheckCircle size={12} className="inline mr-1" />
            Paid ({paidInvoices.length})
          </button>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              activeTab === 'pending'
                ? 'bg-orange-100 text-orange-700 border-orange-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Clock size={12} className="inline mr-1" />
            Pending ({pendingInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              activeTab === 'paid'
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            <CheckCircle size={12} className="inline mr-1" />
            Paid ({paidInvoices.length})
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice #, caregiver, or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading payouts...</div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Banknote size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No {activeTab} payouts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {displayList.map((inv: any) => (
              <div
                key={inv._id}
                onClick={() => navigate(`/invoice/${inv.invoiceNumber}`)}
                className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500">{inv.invoiceNumber}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{inv.caregiverName}</p>
                    <p className="text-xs text-gray-500">for {inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{inv.amount.toLocaleString()} MMK</p>
                    <p className="text-[10px] text-gray-400">{formatDate(inv.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Caregiver</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayList.map((inv: any) => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(`/invoice/${inv.invoiceNumber}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 text-xs">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-medium">{inv.caregiverName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.customerName}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{inv.amount.toLocaleString()} MMK</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payouts;
