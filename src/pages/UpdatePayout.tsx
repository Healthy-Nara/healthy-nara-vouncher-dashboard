import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchInvoiceByNumber, updateCaregiverPayout } from '../api';
import { Search, ArrowLeft, Banknote, Check } from 'lucide-react';

const UpdatePayout = () => {
  const navigate = useNavigate();
  const { invoiceNumber: paramInvoiceNumber } = useParams();
  const [invoiceNumber, setInvoiceNumber] = useState(paramInvoiceNumber || '');
  const [searchQuery, setSearchQuery] = useState(paramInvoiceNumber || '');

  const [formData, setFormData] = useState({
    paymentChannel: 'Bank Transfer',
    payeeAccountName: '',
    dateTime: new Date().toISOString().slice(0, 16),
    note: '',
  });

  const { data: invoice, error, isLoading } = useQuery({
    queryKey: ['invoice-payout', searchQuery],
    queryFn: () => fetchInvoiceByNumber(searchQuery),
    enabled: !!searchQuery,
    retry: false,
  });

  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({ 
        ...prev, 
        payeeAccountName: prev.payeeAccountName || invoice.caregiverName
      }));
    }
  }, [invoice]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateCaregiverPayout(searchQuery, data),
    onSuccess: () => {
      navigate(`/invoice/${searchQuery}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(invoiceNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const inputClasses = "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm";
  const labelClasses = "block text-sm font-semibold text-gray-700";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors mb-2 font-semibold">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Process Caregiver Payout</h1>
        <p className="mt-1 text-sm text-gray-500">Record the disbursement of funds for <span className="text-primary font-bold">Healthy Nara</span>.</p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Enter Invoice Number"
              className="pl-10 block w-full border border-gray-300 rounded-xl p-2.5 focus:ring-primary focus:border-primary shadow-sm"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md">Search</button>
        </form>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500 italic">Finding records...</div>}
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6">
          Invoice not found. Please verify the number.
        </div>
      )}

      {invoice && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Found Invoice</h2>
              <p className="text-xl font-extrabold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-xs text-primary/60 font-bold uppercase tracking-tight">Caregiver</span>
                <p className="font-bold text-gray-900">{invoice.caregiverName}</p>
              </div>
              <div>
                <span className="text-xs text-primary/60 font-bold uppercase tracking-tight">Payout Amount</span>
                <p className="font-bold text-gray-900 text-lg">{invoice.amount.toLocaleString()} MMK</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Payment Channel</label>
                  <select
                    required
                    className={inputClasses}
                    value={formData.paymentChannel}
                    onChange={(e) => setFormData({ ...formData, paymentChannel: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PromptPay">PromptPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Payee Account Name</label>
                  <input
                    type="text"
                    required
                    className={inputClasses}
                    value={formData.payeeAccountName}
                    onChange={(e) => setFormData({ ...formData, payeeAccountName: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Legal name of the account holder receiving the funds.</p>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClasses}>Date/Time Paid</label>
                  <input
                    type="datetime-local"
                    required
                    className={inputClasses}
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Internal Payout Note</label>
                <textarea
                  placeholder="Optional details about this payout..."
                  className={inputClasses + " h-24"}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={mutation.isPending || invoice.caregiverPayoutStatus === 'Paid'}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:shadow-none transition-all"
                >
                  {invoice.caregiverPayoutStatus === 'Paid' ? (
                    <><Check className="mr-2 h-5 w-5" /> Already Paid</>
                  ) : mutation.isPending ? (
                    'Processing Payout...'
                  ) : (
                    <><Banknote className="mr-2 h-5 w-5" /> Finalize Payout</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatePayout;
