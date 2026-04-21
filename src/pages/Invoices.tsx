import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, updateInvoiceStatus, deleteInvoice, updateCustomerPayment, updateCaregiverPayout } from '../api';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Clock, Filter, Plus, Search as SearchIcon, FileText, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange, type Range, type RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  caregiverName: string;
  amount: number;
  platformFee?: number;
  customerPaymentStatus: string;
  caregiverPayoutStatus: string;
  status: string;
}

const Invoices = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({
    status: '',
    customerPaymentStatus: '',
    caregiverPayoutStatus: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
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
        endDate: format(selection.endDate, 'yyyy-MM-dd')
      });
    }
  };

  const resetFilters = () => {
    setFilter({
      status: '',
      customerPaymentStatus: '',
      caregiverPayoutStatus: '',
      startDate: '',
      endDate: ''
    });
    setDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'customer' | 'caregiver'>('customer');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('KBZPay');
  const [additionalNote, setAdditionalNote] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => fetchInvoices(filter),
  });

  const statusMutation = useMutation({
    mutationFn: ({ invoiceNumber, statusData }: { invoiceNumber: string, statusData: { customerPaymentStatus?: string; caregiverPayoutStatus?: string } }) =>
      updateInvoiceStatus(invoiceNumber, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceNumber, type, data }: { invoiceNumber: string, type: 'customer' | 'caregiver', data: { receivedAmount?: number; paymentChannel: string; payerAccountName?: string; payeeAccountName?: string; dateTime: string; note: string } }) =>
      type === 'customer' ? updateCustomerPayment(invoiceNumber, data) : updateCaregiverPayout(invoiceNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsModalOpen(false);
      setSelectedInvoice(null);
      setAdditionalNote('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (invoiceNumber: string) => deleteInvoice(invoiceNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const toggleStatus = (invoice: Invoice, type: 'customer' | 'caregiver') => {
    const invoiceNumber = invoice.invoiceNumber;
    if (type === 'customer') {
      const newStatus = invoice.customerPaymentStatus === 'Received' ? 'Pending' : 'Received';
      if (newStatus === 'Received') {
        setModalType('customer');
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
      } else {
        statusMutation.mutate({ invoiceNumber, statusData: { customerPaymentStatus: newStatus } });
      }
    } else {
      const newStatus = invoice.caregiverPayoutStatus === 'Paid' ? 'Pending' : 'Paid';
      if (newStatus === 'Paid') {
        setModalType('caregiver');
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
      } else {
        statusMutation.mutate({ invoiceNumber, statusData: { caregiverPayoutStatus: newStatus } });
      }
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    const invoiceNumber = selectedInvoice.invoiceNumber;

    if (modalType === 'customer') {
      paymentMutation.mutate({
        invoiceNumber,
        type: 'customer',
        data: {
          receivedAmount: selectedInvoice.amount + (selectedInvoice.platformFee || 0),
          paymentChannel: paymentMethod,
          payerAccountName: selectedInvoice.customerName,
          dateTime: new Date().toISOString(),
          note: additionalNote
        }
      });
    } else {
      paymentMutation.mutate({
        invoiceNumber,
        type: 'caregiver',
        data: {
          paymentChannel: paymentMethod,
          payeeAccountName: selectedInvoice.caregiverName,
          dateTime: new Date().toISOString(),
          note: additionalNote
        }
      });
    }
  };

  const handleDelete = (invoiceNumber: string) => {
    setInvoiceToDelete(invoiceNumber);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteMutation.mutate(invoiceToDelete);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const filteredInvoices = (invoices as Invoice[])?.filter((inv: Invoice) =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.caregiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, onClick?: () => void) => {
    const isClickable = status !== 'Completed';
    const commonClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'} `;

    if (['Completed', 'Received', 'Paid'].includes(status)) {
      return (
        <span
          onClick={(e) => { if (isClickable) { e.preventDefault(); onClick?.(); } }}
          className={`${commonClasses} bg-primary/10 text-primary font-bold`}
        >
          <CheckCircle className="mr-1 h-3 w-3" /> {status}
        </span>
      );
    }
    return (
      <span onClick={(e) => { e.preventDefault(); onClick?.(); }} className={`${commonClasses} bg-amber-100 text-amber-800`}>
        <Clock className="mr-1 h-3 w-3" /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track all generated invoices.</p>
        </div>
        <Link
          to="/create-invoice"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Create Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-xl">
          <div className="relative w-full md:w-100">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {/* <div className="flex items-center gap-2">

              <select
                className="block w-full px-2 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border bg-white shadow-sm"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div> */}

            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <CalendarIcon className="-ml-1 mr-2 h-4 w-4 text-gray-400" />
                {filter.startDate && filter.endDate
                  ? `${format(new Date(filter.startDate), 'dd/MM/yyyy')} - ${format(new Date(filter.endDate), 'dd/MM/yyyy')}`
                  : 'Select Date Range'
                }
              </button>

              {showDatePicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 md:bg-transparent md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:block animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200 origin-center md:origin-top-right scale-90 sm:scale-100">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Filter by Date</span>
                      <button onClick={() => setShowDatePicker(false)} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={18} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="p-1">
                      <DateRange
                        ranges={dateRange}
                        onChange={handleDateRangeChange}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="horizontal"
                        rangeColors={['#1CB89B']}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(filter.status || filter.startDate || filter.endDate) && (
              <button onClick={resetFilters} className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1">
                <X size={14} /> <span className="hidden md:block">Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : filteredInvoices?.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No invoices found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice Info</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parties</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Caregiver Payment</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices?.map((invoice: Invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primary">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(invoice.date).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          <span className="font-semibold text-gray-900">{invoice.customerName}</span>
                          <span className="text-xs text-gray-500">CG: {invoice.caregiverName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{(invoice.amount + (invoice.platformFee || 0)).toLocaleString()} MMK</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.customerPaymentStatus, () => toggleStatus(invoice, 'customer'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.caregiverPayoutStatus, () => toggleStatus(invoice, 'caregiver'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/invoice/${invoice.invoiceNumber}`} className="p-2 text-primary hover:bg-primary/10 rounded-lg"><FileText size={18} /></Link>
                          <button onClick={() => handleDelete(invoice.invoiceNumber)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mobile View: Card Layout */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredInvoices?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No invoices found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInvoices?.map((invoice: Invoice) => (
                <div key={invoice._id} className="p-4 space-y-4 hover:bg-gray-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-black text-primary">{invoice.invoiceNumber}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {new Date(invoice.date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link
                        to={`/invoice/${invoice.invoiceNumber}`}
                        className="p-2.5 text-primary bg-primary/10 rounded-xl"
                      >
                        <FileText size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice.invoiceNumber)}
                        className="p-2.5 text-red-600 bg-red-50 rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 py-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Customer</p>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{invoice.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Caregiver</p>
                      <p className="text-xs font-bold text-gray-500 leading-tight">{invoice.caregiverName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Total Amount</p>
                      <p className="text-sm font-black text-gray-900">
                        {(invoice.amount + (invoice.platformFee || 0)).toLocaleString()} <span className="text-[10px] text-gray-400">MMK</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 scale-90 origin-right">
                      {getStatusBadge(invoice.customerPaymentStatus, () => toggleStatus(invoice, 'customer'))}
                      {getStatusBadge(invoice.caregiverPayoutStatus, () => toggleStatus(invoice, 'caregiver'))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment / Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
              <h3 className="text-lg font-bold text-primary">
                {modalType === 'customer' ? 'Confirm Customer Payment' : 'Confirm Caregiver Payout'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Record the {modalType === 'customer' ? 'receipt' : 'payout'} for {selectedInvoice?.invoiceNumber}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Channel</label>
                <select
                  className="block w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50 font-medium"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="KBZPay">KBZPay</option>
                  <option value="AYAPay">AYAPay</option>
                  <option value="WavePay">WavePay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Note</label>
                <textarea
                  className="block w-full border border-gray-300 rounded-xl p-3 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                  rows={3}
                  placeholder="Enter any additional details..."
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setAdditionalNote('');
                  }}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={paymentMutation.isPending}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {paymentMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <Trash2 className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Delete Invoice?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 border rounded-xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
