import { useMutation } from '@tanstack/react-query';
import { createPublicBooking } from '../api';
import { useState } from 'react';
import { Loader2, CheckCircle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import halogo from '../assets/halogo.png';

interface ChildForm {
  childName: string;
  birthDate: string;
  gender: string;
  hasInfectiousDisease: boolean;
}

const PublicNewBooking = () => {
  const [parentName, setParentName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [township, setTownship] = useState('');
  const [address, setAddress] = useState('');
  
  const [servicePackage, setServicePackage] = useState('Newborn Service');
  const [dutyDuration, setDutyDuration] = useState('daily');
  const [dutyShift, setDutyShift] = useState('day');
  const [dutyStartDate, setDutyStartDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [children, setChildren] = useState<ChildForm[]>([
    { childName: '', birthDate: '', gender: 'Male', hasInfectiousDisease: false }
  ]);

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bookingMutation = useMutation({
    mutationFn: (payload: any) => createPublicBooking(payload),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit booking. Please try again.');
    }
  });

  const handleAddChild = () => {
    setChildren([...children, { childName: '', birthDate: '', gender: 'Male', hasInfectiousDisease: false }]);
  };

  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildForm, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!parentName.trim() || !contactNumber.trim()) {
      setErrorMsg('Parent Name and Contact Number are required.');
      return;
    }

    // Filter valid children
    const validChildren = children.filter(c => c.childName.trim() !== '');

    const payload = {
      parentName,
      contactNumber,
      township,
      address,
      servicePackage,
      dutyDuration,
      dutyShift,
      requestedDates: dutyStartDate ? [new Date(dutyStartDate).toISOString()] : [],
      additionalNotes,
      children: validChildren
    };

    bookingMutation.mutate(payload);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your booking request has been successfully created. Our team will review and contact you shortly to assign a caregiver.
          </p>
        </div>
      </div>
    );
  }

  const inputStyle = 'mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm';
  const labelStyle = 'block text-xs font-semibold text-gray-600 mb-0.5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={halogo} alt="Healthy Nara" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Healthy Nara</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">New Booking Request</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-red-700">{errorMsg}</div>
            </div>
          )}

          {/* Parent Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Parent Info (မိဘအချက်အလက်)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelStyle}>Parent Name * (မိဘအမည်)</label>
                <input required type="text" className={inputStyle} value={parentName}
                  onChange={(e) => setParentName(e.target.value)} placeholder="e.g. Daw Aye Aye" />
              </div>
              <div>
                <label className={labelStyle}>Contact Number * (ဆက်သွယ်ရန်ဖုန်း)</label>
                <input required type="tel" className={inputStyle} value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g. 091234567" />
              </div>
              <div>
                <label className={labelStyle}>Township (မြို့နယ်)</label>
                <input type="text" className={inputStyle} value={township}
                  onChange={(e) => setTownship(e.target.value)} placeholder="e.g. Latha" />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Address (နေရပ်လိပ်စာ)</label>
                <input type="text" className={inputStyle} value={address}
                  onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Room 4, Baho Road" />
              </div>
            </div>
          </div>

          {/* Duty details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Booking Details (ဘွတ်ကင်အချက်အလက်)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Service Package (ဝန်ဆောင်မှုအမျိုးအစား)</label>
                <select className={inputStyle} value={servicePackage} onChange={(e) => setServicePackage(e.target.value)}>
                  <option value="Newborn Service">Newborn Service</option>
                  <option value="Childcare Service">Childcare Service</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Duty Duration (ကြာချိန်)</label>
                <select className={inputStyle} value={dutyDuration} onChange={(e) => setDutyDuration(e.target.value)}>
                  <option value="daily">Daily (နေ့စဉ်)</option>
                  <option value="weekly">Weekly (အပတ်စဉ်)</option>
                  <option value="monthly">Monthly (လစဉ်)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Duty Shift (ဂျူတီအချိန်)</label>
                <select className={inputStyle} value={dutyShift} onChange={(e) => setDutyShift(e.target.value)}>
                  <option value="day">Day (နေ့ဂျူတီ)</option>
                  <option value="night">Night (ညဂျူတီ)</option>
                  <option value="24hours">24 Hours (၂၄ နာရီ)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Duty Start Date (ဂျူတီစတင်မည့်ရက်)</label>
                <input type="date" className={inputStyle} value={dutyStartDate} onChange={(e) => setDutyStartDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Additional Notes (အခြားမှတ်ချက်)</label>
                <textarea className={`${inputStyle} h-20`} value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="e.g. ကလေးကိုသေချာဂရုစိုက်ပေးပါ..." />
              </div>
            </div>
          </div>

          {/* Children Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-gray-900">
                Children Info (ကလေးအချက်အလက်)
              </h2>
              <button type="button" onClick={handleAddChild} className="text-xs font-bold text-primary flex items-center gap-1">
                <Plus size={14} /> Add Child
              </button>
            </div>

            <div className="space-y-4">
              {children.map((child, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative space-y-3">
                  {children.length > 1 && (
                    <button type="button" onClick={() => handleRemoveChild(idx)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelStyle}>Child Name * (ကလေးအမည်)</label>
                      <input required type="text" className={inputStyle} value={child.childName}
                        onChange={(e) => handleChildChange(idx, 'childName', e.target.value)} placeholder="e.g. Milo" />
                    </div>
                    <div>
                      <label className={labelStyle}>Birth Date (မွေးသက္ကရာဇ်)</label>
                      <input type="date" className={inputStyle} value={child.birthDate}
                        onChange={(e) => handleChildChange(idx, 'birthDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Gender (ကျား/မ)</label>
                      <select className={inputStyle} value={child.gender} onChange={(e) => handleChildChange(idx, 'gender', e.target.value)}>
                        <option value="Male">Male (ကျား)</option>
                        <option value="Female">Female (မ)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2 py-1">
                      <input type="checkbox" id={`inf-${idx}`} checked={child.hasInfectiousDisease}
                        onChange={(e) => handleChildChange(idx, 'hasInfectiousDisease', e.target.checked)}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <label htmlFor={`inf-${idx}`} className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        Has Infectious Disease (ကူးစက်တတ်သောရောဂါ ရှိပါသည်)
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={bookingMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {bookingMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            Submit Booking (ဘွတ်ကင်တင်ရန်)
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicNewBooking;
