import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createInvoice, fetchCustomers, fetchCaregivers } from '../api';
import { ArrowLeft, Send, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerId: '',
    caregiverId: '',
    customerName: '',
    caregiverName: '',
    dutyType: 'Day Shift',
    servicePackage: 'N/A',
    amount: 0,
    platformFeeRate: 10,
    date: new Date(),
    serviceStartDate: new Date(),
    serviceEndDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });
  const { data: caregivers } = useQuery({ queryKey: ['caregivers'], queryFn: fetchCaregivers });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...data,
        date: data.date.toISOString(),
        serviceStartDate: data.serviceStartDate.toISOString(),
        serviceEndDate: data.serviceEndDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
      };
      return createInvoice(apiData);
    },
    onSuccess: () => {
      navigate('/');
    },
  });

  const handleCustomerChange = (id: string) => {
    const selected = customers?.find((c: any) => c._id === id);
    if (selected) {
      setFormData({ ...formData, customerId: id, customerName: selected.name });
    } else {
      setFormData({ ...formData, customerId: '', customerName: '' });
    }
  };

  const handleCaregiverChange = (id: string) => {
    const selected = caregivers?.find((c: any) => c._id === id);
    if (selected) {
      setFormData({ ...formData, caregiverId: id, caregiverName: selected.name });
    } else {
      setFormData({ ...formData, caregiverId: '', caregiverName: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const inputClasses = "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm";
  const dateInputClasses = " block w-full p-2.5 text-sm";
  const labelClasses = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors mb-2 font-semibold">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Invoices
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create New Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">Initiate a new financial workflow for <span className="text-primary font-bold">Healthy Nara</span>.</p>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                <Link to="/customers" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> New Profile
                </Link>
              </div>
              <div>
                <label className={labelClasses}>Select Customer</label>
                <select
                  required
                  className={inputClasses}
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers?.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Display Name on Invoice</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Johnson"
                  className={inputClasses}
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                <h2 className="text-lg font-bold text-gray-900">Caregiver</h2>
                <Link to="/caregivers" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> New Profile
                </Link>
              </div>
              <div>
                <label className={labelClasses}>Select Caregiver</label>
                <select
                  required
                  className={inputClasses}
                  value={formData.caregiverId}
                  onChange={(e) => handleCaregiverChange(e.target.value)}
                >
                  <option value="">-- Choose Caregiver --</option>
                  {caregivers?.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Display Name on Invoice</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Smith"
                  className={inputClasses}
                  value={formData.caregiverName}
                  onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Duty & Financials</h2>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-3">
                <label className={labelClasses}>Duty Type / Service Package</label>
                <select
                  required
                  className={inputClasses}
                  value={formData.dutyType}
                  onChange={(e) => setFormData({ ...formData, dutyType: e.target.value })}
                >
                  <option value="Day Shift">Day Shift (08:00 AM - 08:00 PM)</option>
                  <option value="Night Shift">Night Shift (08:00 PM - 08:00 AM)</option>
                  <option value="24-Hour Care">24-Hour Full Care</option>
                  <option value="Hourly">Hourly Basis</option>
                  <option value="Newborn Care Service">Newborn Care Service</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Specialized Service (Optional)</label>
                <select
                  className={inputClasses}
                  value={formData.servicePackage}
                  onChange={(e) => setFormData({ ...formData, servicePackage: e.target.value })}
                >
                  <option value="N/A">N/A</option>
                  <option value="Newborn Service">Newborn Service</option>
                  <option value="Childcare Service">Childcare Service</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Service Amount (MMK)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`${inputClasses} pl-3 pr-14 font-bold text-gray-900 bg-gray-50/30`}
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xs font-bold">MMK</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Platform Fee (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className={`${inputClasses} font-semibold`}
                    value={formData.platformFeeRate}
                    onChange={(e) => setFormData({ ...formData, platformFeeRate: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xs font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Invoice Date</label>
                <div className="relative border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary">
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
                    dateFormat="dd/MM/yyyy"
                    className={dateInputClasses}
                    required
                  />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Due Date</label>
                <div className="relative border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary">
                  <DatePicker
                    selected={formData.dueDate}
                    onChange={(date) => setFormData({ ...formData, dueDate: date || new Date() })}
                    dateFormat="dd/MM/yyyy"
                    className={dateInputClasses}
                    required
                  />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Service Start Date</label>
                <div className="relative border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary">
                  <DatePicker
                    selected={formData.serviceStartDate}
                    onChange={(date) => setFormData({ ...formData, serviceStartDate: date || new Date() })}
                    dateFormat="dd/MM/yyyy"
                    className={dateInputClasses}
                    required
                  />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Service End Date</label>
                <div className="relative border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary">
                  <DatePicker
                    selected={formData.serviceEndDate}
                    onChange={(date) => setFormData({ ...formData, serviceEndDate: date || new Date() })}
                    dateFormat="dd/MM/yyyy"
                    className={dateInputClasses}
                    required
                  />
                  <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 shadow-inner">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium tracking-tight">Caregiver Payout (Net):</span>
                  <span className="font-bold text-gray-900 text-base">{formData.amount.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium tracking-tight">Platform Service Fee ({formData.platformFeeRate}%):</span>
                  <span className="font-bold text-emerald-600">+{((formData.amount * formData.platformFeeRate) / 100).toLocaleString()} MMK</span>
                </div>
                <div className="pt-4 mt-2 border-t border-primary/20 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Billable Amount</p>
                    <p className="text-xs text-gray-400 font-medium">Payable by Customer</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary tracking-tighter">
                      {(formData.amount + (formData.amount * formData.platformFeeRate / 100)).toLocaleString()}
                    </span>
                    <span className="ml-1.5 text-xs font-black text-primary/60">MMK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:shadow-none transition-all"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Generate Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
