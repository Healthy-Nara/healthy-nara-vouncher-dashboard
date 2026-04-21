import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchInvoiceByNumber, updateCustomerPayment } from '../api';
import { Search, ArrowLeft, CreditCard, Check } from 'lucide-react';

const UpdatePayment = () => {
  const navigate = useNavigate();
  const { invoiceNumber: paramInvoiceNumber } = useParams();
  const [invoiceNumber, setInvoiceNumber] = useState(paramInvoiceNumber || '');
  const [searchQuery, setSearchQuery] = useState(paramInvoiceNumber || '');

  const [formData, setFormData] = useState({
    receivedAmount: 0,
    paymentChannel: 'Bank Transfer',
    payerAccountName: '',
    dateTime: new Date().toISOString().slice(0, 16),
    note: '',
  });

  const { data: invoice, error, isLoading } = useQuery({
    queryKey: ['invoice', searchQuery],
    queryFn: () => fetchInvoiceByNumber(searchQuery),
    enabled: !!searchQuery,
    retry: false,
  });

  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({ 
        ...prev, 
        receivedAmount: invoice.amount,
        payerAccountName: prev.payerAccountName || invoice.customerName
      }));
    }
  }, [invoice]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateCustomerPayment(searchQuery, data),
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Record Customer Payment</h1>
        <p className="mt-1 text-sm text-gray-500">Record a payment received for <span className="text-primary font-bold">Healthy Nara</span>.</p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Enter Invoice Number (e.g. INV-20260417-0001)"
              className="pl-10 block w-full border border-gray-300 rounded-xl p-2.5 focus:ring-primary focus:border-primary shadow-sm"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md">Search</button>
        </form>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500 italic">Searching database...</div>}
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <div className="bg-red-100 p-1.5 rounded-full">
            <Search className="h-4 w-4" />
          </div>
          Invoice not found. Please verify the invoice number.
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
                <span className="text-xs text-primary/60 font-bold uppercase tracking-tight">Customer</span>
                <p className="font-bold text-gray-900">{invoice.customerName}</p>
              </div>
              <div>
                <span className="text-xs text-primary/60 font-bold uppercase tracking-tight">Required Amount</span>
                <p className="font-bold text-gray-900 text-lg">{invoice.amount.toLocaleString()} MMK</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Received Amount (MMK)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className={inputClasses}
                    value={formData.receivedAmount}
                    onChange={(e) => setFormData({ ...formData, receivedAmount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Payment Channel</label>
                  <select
                    required
                    className={inputClasses}
                    value={formData.paymentChannel}
                    onChange={(e) => setFormData({ ...formData, paymentChannel: e.target.value })}
                  >
                    <option value="KBZPay">KBZPay</option>
                    <option value="AYAPay">AYAPay</option>
                    <option value="WavePay">WavePay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Payer Account Name</label>
                  <input
                    type="text"
                    required
                    className={inputClasses}
                    value={formData.payerAccountName}
                    onChange={(e) => setFormData({ ...formData, payerAccountName: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">The name of the person/entity that actually sent the funds.</p>
                </div>
                <div>
                  <label className={labelClasses}>Date/Time Received</label>
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
                <label className={labelClasses}>Internal Note</label>
                <textarea
                  placeholder="Optional details about this payment..."
                  className={inputClasses + " h-24"}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={mutation.isPending || invoice.customerPaymentStatus === 'Received'}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:shadow-none transition-all"
                >
                  {invoice.customerPaymentStatus === 'Received' ? (
                    <><Check className="mr-2 h-5 w-5" /> Already Recorded</>
                  ) : mutation.isPending ? (
                    'Saving Payment...'
                  ) : (
                    <><CreditCard className="mr-2 h-5 w-5" /> Confirm & Post Payment</>
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

export default UpdatePayment;
