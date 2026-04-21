import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoiceByNumber, updateInvoiceStatus, updateInvoice, fetchCustomers, fetchCaregivers, updateCustomerPayment, updateCaregiverPayout, fetchCustomerById } from '../api';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Image as ImageIcon, CheckCircle, Clock, CreditCard, Banknote, ShieldCheck, Save, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { downloadAsImage, downloadAsPDF } from '../utils/export';
import halogo from '../assets/halogo.png';
import patternBg from '../assets/pattern.png';
import autosign from '../assets/autosign.png';

const formatDateSlash = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Background pattern image for invoice/receipt preview

const InvoiceDetail = () => {
  const { invoiceNumber } = useParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'invoice' | 'customer' | 'caregiver'>('invoice');
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isStatusEditing, setIsStatusEditing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'customer' | 'caregiver'>('customer');
  const [paymentMethod, setPaymentMethod] = useState('KBZPay');
  const [additionalNote, setAdditionalNote] = useState('');

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice-detail', invoiceNumber],
    queryFn: () => fetchInvoiceByNumber(invoiceNumber!),
    enabled: !!invoiceNumber,
  });

  console.log(invoice)

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  const { data: customerDetail } = useQuery({
    queryKey: ['customer-detail', invoice?.customer],
    queryFn: () => fetchCustomerById(invoice?.customer),
    enabled: !!invoice?.customer,
  });

  console.log('customerDetail', customerDetail)

  const { data: caregivers } = useQuery({ queryKey: ['caregivers'], queryFn: fetchCaregivers });

  const statusMutation = useMutation({
    mutationFn: (statusData: any) => updateInvoiceStatus(invoiceNumber!, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceNumber] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ type, data }: { type: 'customer' | 'caregiver', data: any }) =>
      type === 'customer' ? updateCustomerPayment(invoiceNumber!, data) : updateCaregiverPayout(invoiceNumber!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceNumber] });
      setIsModalOpen(false);
      setAdditionalNote('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (invoiceData: any) => updateInvoice(invoiceNumber!, invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceNumber] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    },
  });

  useEffect(() => {
    if (invoice && !editData) {
      setEditData({
        customerName: invoice.customerName || '',
        caregiverName: invoice.caregiverName || '',
        amount: invoice.amount || 0,
        platformFeeRate: invoice.platformFeeRate || 10,
        dutyType: invoice.dutyType || 'Day Shift',
        servicePackage: invoice.servicePackage || 'N/A',
        date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
        serviceStartDate: invoice.serviceStartDate ? new Date(invoice.serviceStartDate).toISOString().split('T')[0] : '',
        serviceEndDate: invoice.serviceEndDate ? new Date(invoice.serviceEndDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        paymentMethod: invoice.paymentMethod || 'Kpay',
      });
    }
  }, [invoice]);

  useEffect(() => {
    if (invoice) {
      if (invoice.customerPaymentStatus === 'Received' && viewMode === 'invoice') {
        setViewMode('customer');
      }
    }
  }, [invoice?.customerPaymentStatus]);

  if (isLoading) return <div className="text-center py-20">Loading invoice details...</div>;
  if (error || !invoice) return <div className="text-center py-20 text-red-600">Invoice not found.</div>;

  const isReceipt = invoice.customerPaymentStatus === 'Received';
  const isVoucher = invoice.caregiverPayoutStatus === 'Paid';

  const toggleCustomerStatus = () => {
    const newStatus = invoice.customerPaymentStatus === 'Received' ? 'Pending' : 'Received';

    if (newStatus === 'Received') {
      setModalType('customer');
      setIsModalOpen(true);
    } else {
      statusMutation.mutate({ customerPaymentStatus: newStatus });
    }
  };

  const handleConfirmPayment = () => {
    if (modalType === 'customer') {
      paymentMutation.mutate({
        type: 'customer',
        data: {
          receivedAmount: invoice.amount + (invoice.platformFee || 0),
          paymentChannel: paymentMethod,
          payerAccountName: invoice.customerName,
          dateTime: new Date().toISOString(),
          note: additionalNote
        }
      });
      // Also sync payment method on the invoice itself
      updateMutation.mutate({ ...editData, paymentMethod });
    } else {
      paymentMutation.mutate({
        type: 'caregiver',
        data: {
          paymentChannel: paymentMethod,
          payeeAccountName: invoice.caregiverName,
          dateTime: new Date().toISOString(),
          note: additionalNote
        }
      });
    }
  };

  const toggleCaregiverStatus = () => {
    const newStatus = invoice.caregiverPayoutStatus === 'Paid' ? 'Pending' : 'Paid';
    if (newStatus === 'Paid') {
      setModalType('caregiver');
      setIsModalOpen(true);
    } else {
      statusMutation.mutate({ caregiverPayoutStatus: newStatus });
    }
  };

  const handleUpdate = () => {
    if (editData) updateMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setEditData({
      customerName: invoice.customerName || '',
      caregiverName: invoice.caregiverName || '',
      amount: invoice.amount || 0,
      dutyType: invoice.dutyType || 'Day Shift',
      date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
      paymentMethod: invoice.paymentMethod || 'Kpay',
    });
    setIsEditing(false);
  };

  const handleCustomerSelect = (id: string) => {
    const selected = customers?.find((c: any) => c._id === id);
    if (selected) setEditData({ ...editData, customerId: id, customerName: selected.name });
  };

  const handleCaregiverSelect = (id: string) => {
    const selected = caregivers?.find((c: any) => c._id === id);
    if (selected) setEditData({ ...editData, caregiverId: id, caregiverName: selected.name });
  };

  const activeWatermark = (viewMode === 'customer' && isReceipt) || (viewMode === 'caregiver' && isVoucher);
  const displayData = editData || invoice;
  const currentPlatformFeeRate = displayData.platformFeeRate || 10;
  const currentPlatformFee = displayData.platformFee || Math.round((displayData.amount || 0) * (currentPlatformFeeRate / 100));
  const netPayout = (displayData.amount || 0); // Caregiver gets base amount
  const grandTotal = (displayData.amount || 0) + currentPlatformFee; // Customer pays Amount + Fee

  const inputClasses = "block w-full border border-gray-200 rounded-lg shadow-sm p-2 focus:ring-primary focus:border-primary text-sm transition-all duration-200 hover:border-primary/40 bg-white";
  const labelClasses = "block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1";
  const valueClasses = "text-sm font-semibold text-gray-900";

  return (
    <div className={`mx-auto pb-20 transition-all duration-300 ${showPreview ? 'max-w-[1600px]' : 'max-w-3xl'}`}>
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-5">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors font-semibold">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tight mr-2">Invoice</span>
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">{invoice.invoiceNumber}</span>
        </div>
      </div>

      {/* Success Toast */}
      {updateSuccess && (
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 flex items-center gap-2 animate-fadeIn mb-5">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">Invoice updated successfully!</span>
        </div>
      )}

      {/* ========== ADAPTIVE LAYOUT ========== */}
      <div className={`grid gap-5 items-start transition-all duration-300 ${showPreview ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>

        {/* ========== LEFT COLUMN: Admin Controls + Invoice Data ========== */}
        <div className={`space-y-5 ${showPreview ? 'lg:col-span-5' : ''}`}>

          {/* ---- Admin Controls Card (FIRST) ---- */}
          <div className="bg-white border border-primary/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-5 py-2.5 border-b border-primary/20 flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Controls</h3>
              <button
                onClick={() => setIsStatusEditing(!isStatusEditing)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${isStatusEditing ? 'bg-red-500 text-white' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
              >
                {isStatusEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isReceipt ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Customer Payment</p>
                    <p className="text-xs font-bold text-gray-900">{invoice.customerPaymentStatus}</p>
                  </div>
                </div>
                {(!isReceipt || isStatusEditing) && (
                  <button onClick={toggleCustomerStatus} disabled={statusMutation.isPending}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${isReceipt ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-primary text-white hover:bg-primary-dark'}`}>
                    {isReceipt ? 'Mark Pending' : 'Mark Received'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isVoucher ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                    <Banknote size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Caregiver Payout</p>
                    <p className="text-xs font-bold text-gray-900">{invoice.caregiverPayoutStatus}</p>
                  </div>
                </div>
                {(!isVoucher || isStatusEditing) && (
                  <button onClick={toggleCaregiverStatus} disabled={statusMutation.isPending}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${isVoucher ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-primary text-white hover:bg-primary-dark'}`}>
                    {isVoucher ? 'Mark Pending' : 'Mark Paid'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`w-full inline-flex items-center justify-center px-5 py-2.5 border border-transparent shadow-md text-sm font-bold rounded-xl transition-all duration-300 mt-1 ${showPreview ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gradient-to-r from-primary to-emerald-600 text-white hover:from-primary-dark hover:to-emerald-700 hover:shadow-lg hover:scale-[1.01]'}`}>
                {showPreview ? (<><EyeOff className="mr-2 h-4 w-4" /> Hide Preview</>) : (<><Eye className="mr-2 h-4 w-4" /> Generate Preview</>)}
              </button>
            </div>
          </div>

          {/* ---- Invoice Data Card (SECOND) ---- */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Invoice Details</h2>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200 gap-1">
                    <Pencil size={12} /> Edit
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancelEdit}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 gap-1">
                      <X size={12} /> Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={updateMutation.isPending}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-all duration-200 gap-1 shadow-sm disabled:opacity-50">
                      {updateMutation.isPending ? (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (<Save size={12} />)}
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-3">Customer</h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className={labelClasses}>Select Customer</label>
                        <select className={inputClasses} value={editData?.customerId || ''} onChange={(e) => handleCustomerSelect(e.target.value)}>
                          <option value="">-- Keep Current --</option>
                          {customers?.map((c: any) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Name on Invoice</label>
                        <input type="text" className={inputClasses} value={editData?.customerName || ''} onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} placeholder="Customer name" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-3">Caregiver</h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className={labelClasses}>Select Caregiver</label>
                        <select className={inputClasses} value={editData?.caregiverId || ''} onChange={(e) => handleCaregiverSelect(e.target.value)}>
                          <option value="">-- Keep Current --</option>
                          {caregivers?.map((c: any) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Name on Invoice</label>
                        <input type="text" className={inputClasses} value={editData?.caregiverName || ''} onChange={(e) => setEditData({ ...editData, caregiverName: e.target.value })} placeholder="Caregiver name" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-3">Duty & Financials</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelClasses}>Duty Type</label>
                        <select className={inputClasses} value={editData?.dutyType || 'Day Shift'} onChange={(e) => setEditData({ ...editData, dutyType: e.target.value })}>
                          <option value="Day Shift">Day Shift</option>
                          <option value="Night Shift">Night Shift</option>
                          <option value="24-Hour Care">24-Hour Care</option>

                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Specialized Service</label>
                        <select className={inputClasses} value={editData?.servicePackage || 'N/A'} onChange={(e) => setEditData({ ...editData, servicePackage: e.target.value })}>
                          <option value="N/A">N/A</option>
                          <option value="Newborn Service">Newborn Service</option>
                          <option value="Childcare Service">Childcare Service</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Amount (MMK)</label>
                        <input type="number" min="0" className={inputClasses} value={editData?.amount || ''} onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Platform Fee (%)</label>
                        <input type="number" min="0" max="100" step="0.1" className={inputClasses} value={editData?.platformFeeRate || 10} onChange={(e) => setEditData({ ...editData, platformFeeRate: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Invoice Date</label>
                        <input type="date" className={inputClasses} value={editData?.date || ''} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Service Start</label>
                        <input type="date" className={inputClasses} value={editData?.serviceStartDate || ''} onChange={(e) => setEditData({ ...editData, serviceStartDate: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Service End</label>
                        <input type="date" className={inputClasses} value={editData?.serviceEndDate || ''} onChange={(e) => setEditData({ ...editData, serviceEndDate: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Due Date</label>
                        <input type="date" className={inputClasses} value={editData?.dueDate || ''} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClasses}>Payment Method</label>
                        <select className={inputClasses} value={editData?.paymentMethod || 'Kpay'} onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}>
                          <option value="KBZPay">KBZPay</option>
                          <option value="AYAPay">AYAPay</option>
                          <option value="WavePay">WavePay</option>

                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/15">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 text-xs">Caregiver Payout (Base)</span>
                      <span className="font-bold text-gray-700">{(editData?.amount || 0).toLocaleString()} MMK</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500 text-xs text-primary">Platform Fees ({editData?.platformFeeRate || 10}%)</span>
                      <span className="font-semibold text-primary">+{(editData?.amount * (editData?.platformFeeRate || 10) / 100).toLocaleString()} MMK</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-primary/20">
                      <span className="font-bold text-gray-800 text-xs uppercase">Grand Total (Customer Pays)</span>
                      <span className="font-extrabold text-primary">{grandTotal.toLocaleString()} MMK</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Customer</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={labelClasses}>Name</p>
                        <p className={valueClasses}>{invoice.customerName}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isReceipt ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                        {isReceipt ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {invoice.customerPaymentStatus}
                      </span>
                    </div>
                    {invoice.paymentDetails && (
                      <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <div>
                          <p className={labelClasses}>Method</p>
                          <p className="text-xs font-semibold text-gray-700">{invoice.paymentDetails.paymentChannel}</p>
                        </div>
                        {invoice.paymentDetails.note && (
                          <div className="text-right">
                            <p className={labelClasses}>Note</p>
                            <p className="text-xs text-gray-600 italic">"{invoice.paymentDetails.note}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Caregiver</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={labelClasses}>Name</p>
                        <p className={valueClasses}>{invoice.caregiverName}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isVoucher ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                        {isVoucher ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {invoice.caregiverPayoutStatus}
                      </span>
                    </div>
                    {invoice.payoutDetails && (
                      <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <div>
                          <p className={labelClasses}>Method</p>
                          <p className="text-xs font-semibold text-gray-700">{invoice.payoutDetails.paymentChannel}</p>
                        </div>
                        {invoice.payoutDetails.note && (
                          <div className="text-right">
                            <p className={labelClasses}>Note</p>
                            <p className="text-xs text-gray-600 italic">"{invoice.payoutDetails.note}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Duty & Financials</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className={labelClasses}>Duty Type</p><p className={valueClasses}>{invoice.dutyType}</p></div>
                      <div><p className={labelClasses}>Specialized Service</p><p className={valueClasses}>{invoice.servicePackage || 'N/A'}</p></div>
                      <div><p className={labelClasses}>Invoice Date</p><p className={valueClasses}>{formatDateSlash(invoice.date)}</p></div>
                      <div><p className={labelClasses}>Due Date</p><p className={valueClasses}>{invoice.dueDate ? formatDateSlash(invoice.dueDate) : 'N/A'}</p></div>
                      <div><p className={labelClasses}>Service Start</p><p className={valueClasses}>{invoice.serviceStartDate ? formatDateSlash(invoice.serviceStartDate) : 'N/A'}</p></div>
                      <div><p className={labelClasses}>Service End</p><p className={valueClasses}>{invoice.serviceEndDate ? formatDateSlash(invoice.serviceEndDate) : 'N/A'}</p></div>
                      <div><p className={labelClasses}>Payment Method</p><p className={valueClasses}>{invoice.paymentMethod || 'Kpay'}</p></div>
                      <div><p className={labelClasses}>Payout Amount (Base)</p><p className="text-sm font-bold text-gray-900">{invoice.amount.toLocaleString()} MMK</p></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <div><p className={labelClasses}>Platform Fee ({invoice.platformFeeRate || 10}%)</p><p className="text-sm font-semibold text-primary">+{currentPlatformFee.toLocaleString()} MMK</p></div>
                      <div className="text-right"><p className={labelClasses}>Grand Total (Customer Pays)</p><p className="text-base font-extrabold text-primary">{grandTotal.toLocaleString()} MMK</p></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== RIGHT COLUMN: Invoice Preview ========== */}
        {showPreview && (
          <div className="lg:col-span-7">
            <div className="space-y-3 animate-fadeIn lg:sticky lg:top-4">
              <div className="flex flex-wrap items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm gap-2">
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  <button onClick={() => setViewMode('invoice')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'invoice' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                    Invoice
                  </button>
                  <button disabled={!isReceipt} onClick={() => setViewMode('customer')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!isReceipt ? 'opacity-50 cursor-not-allowed' : ''} ${viewMode === 'customer' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                    Customer Receipt
                  </button>
                  <button disabled={!isVoucher} onClick={() => setViewMode('caregiver')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!isVoucher ? 'opacity-50 cursor-not-allowed' : ''} ${viewMode === 'caregiver' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                    Caregiver Receipt
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => downloadAsImage('document-preview', `${viewMode === 'invoice' ? 'Invoice' : 'Receipt'}-${invoice.invoiceNumber}`)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-[11px] font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <ImageIcon className="mr-1 h-3 w-3 text-gray-400" /> PNG
                  </button>
                  <button onClick={() => downloadAsPDF('document-preview', `${viewMode === 'invoice' ? 'Invoice' : 'Receipt'}-${invoice.invoiceNumber}`)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-[11px] font-bold rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors">
                    <FileText className="mr-1 h-3 w-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Invoice Document Wrapper for Mobile Scrolling */}
              <div className="overflow-x-auto pb-6 rounded-2xl shadow-inner bg-gray-200/50 p-1">
                <div
                  id="document-preview"
                  className="relative mx-auto shadow-2xl"
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '40px',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    minWidth: '800px',
                    width: '800px'
                  }}
                >

                  {/* Background pattern overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    backgroundImage: `url(${patternBg})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '600px',
                    opacity: 0.35,
                    pointerEvents: 'none',
                  }} />

                  {/* {activeWatermark && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-[-30deg]" style={{ zIndex: 2 }}>
                    <h1 className="text-[160px] font-black tracking-tighter">PAID</h1>
                  </div>
                )} */}

                  {/* Content wrapper - sits above the pattern */}
                  <div style={{ position: 'relative', zIndex: 1 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={halogo} alt="Healthy Nara" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#1CB89B', letterSpacing: '-0.5px' }}>Healthy Nara</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1CB89B', letterSpacing: '5px', textTransform: 'uppercase', margin: 0 }}>
                          {viewMode === 'invoice' ? 'INVOICE' : 'RECEIPT'}
                        </h1>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 3px 0' }}>Invoice to:</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#1CB89B', margin: '0 0 3px 0' }}>{invoice.customerName}</p>
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 2px 0' }}>
                          {invoice.servicePackage && invoice.servicePackage !== 'N/A' ? invoice.servicePackage : 'General Care Service'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 2px 0' }}>
                          {customerDetail?.address || 'N/A'}
                          {customerDetail?.address && customerDetail?.township && ` ၊ `}
                          {customerDetail?.township || 'Yangon'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '11px', color: '#374151', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600 }}>Due Date</span>
                          <span>: {displayData.dueDate ? formatDateSlash(displayData.dueDate) : formatDateSlash(displayData.date)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '11px', color: '#374151' }}>
                          <span style={{ fontWeight: 600 }}>Invoice Date</span>
                          <span>: {formatDateSlash(displayData.date)}</span>
                        </div>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
                      <thead>
                        <tr>
                          {['Start Date', 'End Date', 'Service Package', 'Nurse Aid Name'].map(h => (
                            <th key={h} style={{ backgroundColor: '#1CB89B', color: '#fff', padding: '8px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', border: '1px solid #1CB89B' }}>{h}</th>
                          ))}
                          <th style={{ backgroundColor: '#1CB89B', color: '#fff', padding: '8px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', border: '1px solid #1CB89B' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>{invoice.serviceStartDate ? formatDateSlash(invoice.serviceStartDate) : formatDateSlash(invoice.date)}</td>
                          <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>{invoice.serviceEndDate ? formatDateSlash(invoice.serviceEndDate) : formatDateSlash(invoice.date)}</td>
                          <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                            {invoice.servicePackage && invoice.servicePackage !== 'N/A'
                              ? `${invoice.dutyType} (${invoice.servicePackage})`
                              : invoice.dutyType}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: '11px', color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'center' }}>{invoice.caregiverName}</td>
                          <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#1CB89B', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right' }}>{invoice.amount.toLocaleString()} MMK</td>
                        </tr>
                        {[1, 2, 3, 4].map((i) => (
                          <tr key={i}>
                            {[0, 1, 2, 3, 4].map(j => (
                              <td key={j} style={{ padding: '8px 10px', backgroundColor: i % 2 === 0 ? '#d1d5db' : '#9ca3af', border: '1px solid #e5e7eb', height: j === 0 ? '14px' : undefined }}>&nbsp;</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0' }}>
                      <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>Platform fees ({displayData.platformFeeRate || 10}%) :</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1CB89B' }}>+{currentPlatformFee.toLocaleString()} MMK</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderTop: '2px solid #1CB89B' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>{viewMode === 'caregiver' ? 'PAYOUT AMOUNT :' : 'GRAND TOTAL :'}</span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>{(viewMode === 'caregiver' ? displayData.amount : grandTotal).toLocaleString()} MMK</span>
                        </div>
                      </div>
                    </div>

                    {viewMode === 'caregiver' && invoice.payoutDetails ? (
                      <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'rgba(28,184,155,0.05)', borderRadius: '8px', border: '1px solid rgba(28,184,155,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                          <ShieldCheck size={12} color="#1CB89B" />
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#1CB89B', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Payout Confirmation (To Caregiver)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div><p style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Payee Name</p><p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', margin: 0 }}>{invoice.payoutDetails.payeeAccountName}</p></div>
                          <div><p style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Payout Date</p><p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', margin: 0 }}>{new Date(invoice.payoutDetails.dateTime).toLocaleString()}</p></div>
                          <div><p style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px 0' }}>Method</p><p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', margin: 0 }}>{invoice.payoutDetails.paymentChannel}</p></div>
                        </div>
                      </div>
                    ) : viewMode === 'customer' && invoice.paymentDetails ? (
                      null
                    ) : null}

                    <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', color: '#374151', fontWeight: 700, margin: '0 0 10px 0' }}>Payment Method</p>

                        {viewMode === 'invoice' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <div>
                              <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#A0222C', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>AYA Pay</h4>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 2px 0', fontWeight: 700 }}>AccNumber - 09-426 106 176</p>
                              <p style={{ fontSize: '13px', color: '#374151', margin: 0, fontWeight: 700 }}>Name - Akari Myat Phyo</p>
                            </div>
                            <div>
                              <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#075CAB', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>KBZPay</h4>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 2px 0', fontWeight: 700 }}>AccNumber - 09-426 106 176</p>
                              <p style={{ fontSize: '11px', color: '#374151', margin: 0, fontWeight: 700 }}>Name - Akari Myat Phyo</p>
                            </div>
                            <div>
                              <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#FFE508', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>WAVE PAY</h4>
                              <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 2px 0', fontWeight: 700 }}>AccNumber - 09-426 106 176</p>
                              <p style={{ fontSize: '11px', color: '#374151', margin: 0, fontWeight: 700 }}>Name - Akari Myat Phyo</p>
                            </div>
                          </div>
                        ) :

                          (
                            viewMode === 'caregiver' && invoice.payoutDetails ? (
                              <>
                                <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 2px 0' }}>Service fees – {invoice.payoutDetails.paymentChannel || 'Kpay'}</p>
                                <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 24px 0' }}>Platform fees – {invoice.payoutDetails.paymentChannel || 'Kpay'}</p>
                              </>
                            ) :
                              viewMode === 'customer' && invoice.paymentDetails ? (
                                <>
                                  <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 2px 0' }}>Service fees – {invoice.paymentDetails.paymentChannel || 'Kpay'}</p>
                                  <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 24px 0' }}>Platform fees – {invoice.paymentDetails.paymentChannel || 'Kpay'}</p>
                                </>
                              ) :
                                <>
                                  <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 2px 0' }}>Service fees – {invoice.paymentMethod || 'Kpay'}</p>
                                  <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 24px 0' }}>Platform fees – {invoice.paymentMethod || 'Kpay'}</p>
                                </>
                          )}

                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '50px' }}>
                      <div>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1CB89B', lineHeight: 1.35, margin: 0, fontStyle: 'italic' }}>
                          Your satisfaction is our priority – <br /> thank you for relying on us.
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '160px', position: 'relative' }}>
                        <img
                          src={autosign}
                          alt="Signature"
                          style={{
                            width: '120px',
                            position: 'absolute',
                            bottom: '22px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                            filter: 'contrast(1.1)',
                            opacity: 0.95
                          }}
                        />
                        <div style={{ width: '100px', height: '1px', backgroundColor: '#374151', margin: '0 auto 6px auto', opacity: 0.4 }}></div>
                        <div style={{ marginTop: '10px', height: '20px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', margin: '0 0 2px 0' }}>Khin Me Me Zin</p>
                          <p style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>Administrator</p>
                        </div>
                      </div>
                    </div>
                  </div>{/* End content-wrapper */}
                </div>{/* End document-preview */}
              </div>{/* End overflow-scroll wrapper */}
            </div>{/* End lg:sticky */}
          </div>
        )}
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
                Record the {modalType === 'customer' ? 'receipt' : 'payout'} for {invoice.invoiceNumber}
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
                  <option value="KBZPay (Kpay)">KBZPay (Kpay)</option>
                  <option value="WavePay">WavePay</option>
                  <option value="AYAPay">AYAPay</option>
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
    </div>
  );
};

export default InvoiceDetail;
