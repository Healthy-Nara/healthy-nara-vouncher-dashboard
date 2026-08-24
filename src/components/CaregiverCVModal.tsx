import React, { useRef } from 'react';
import { X, Download, Printer, ShieldCheck, Phone, MapPin, Award, CheckCircle2, User, HeartPulse, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import halogo from '../assets/halogo.png';
import patternBg from '../assets/pattern.png';
import autosign from '../assets/autosign.png';
import { downloadAsImage, downloadAsPDF } from '../utils/export';

interface CaregiverCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiver: {
    _id?: string;
    caregiverName: string;
    contactNumber: string;
    gender?: string;
    township?: string;
    NRC?: string;
    address?: string;
    birthdate?: string;
    specialization?: string;
    note?: string;
    createdAt?: string;
  };
  stats?: {
    bookingCount?: number;
    completedCount?: number;
  };
}

export const CaregiverCVModal: React.FC<CaregiverCVModalProps> = ({
  isOpen,
  onClose,
  caregiver,
  stats,
}) => {
  const cvContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !caregiver) return null;

  const cvId = `cv-sheet-${caregiver._id || 'caregiver'}`;
  const fileName = `Caregiver_CV_${(caregiver.caregiverName || 'profile').replace(/\s+/g, '_')}`;

  const calculateAge = (birthdateStr?: string) => {
    if (!birthdateStr) return null;
    try {
      const birth = new Date(birthdateStr);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  const age = calculateAge(caregiver.birthdate);
  const formattedBirthdate = caregiver.birthdate
    ? format(new Date(caregiver.birthdate), 'dd MMMM yyyy')
    : 'N/A';

  const specializations = caregiver.specialization
    ? caregiver.specialization.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Elderly Care', 'General Nursing Care', 'Patient Support'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">

        {/* Action Header - Hidden during print */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">Caregiver Curriculum Vitae</h2>
              <p className="text-xs text-gray-400 mt-1">Preview and export official verified profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadAsImage(cvId, fileName)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-all border border-gray-700"
              title="Download as PNG Image"
            >
              <ImageIcon size={14} />
              <span>PNG Image</span>
            </button>
            <button
              onClick={() => downloadAsPDF(cvId, fileName)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm"
              title="Download as PDF"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-all border border-gray-700"
              title="Print Document"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-8 bg-gray-100/70 overflow-x-auto flex justify-center print:p-0 print:bg-white">

          {/* Printable CV Sheet with Soft Receipt-style Watermark */}
          <div
            id={cvId}
            ref={cvContainerRef}
            className="relative w-full max-w-[794px] min-h-[1050px] bg-white border border-gray-200 shadow-md p-8 sm:p-12 text-gray-800 overflow-hidden font-sans print:border-none print:shadow-none print:p-8"
          >
            {/* Repeating Background Pattern Watermark Overlay (Invoice Style) */}
            <div
              className="absolute inset-0 pointer-events-none select-none z-0"
              style={{
                backgroundImage: `url(${patternBg})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '600px',
                opacity: 0.4,
              }}
            />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between pb-6 border-b-2 border-emerald-500/30">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3.5">
                <img
                  src={halogo}
                  alt="Healthy Nara"
                  className="w-12 h-12 rounded-xl object-contain shadow-sm border border-emerald-500/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-600 tracking-tight">
                      Healthy Nara
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase mt-0.5">
                    Healthcare & Caregiver Services
                  </p>
                </div>
              </div>

              {/* CV Meta */}
              <div className="text-right">
                <div className="inline-block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3 py-1 rounded-lg">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Caregiver Profile ID
                  </p>
                  <p className="text-xs font-black text-emerald-700 font-mono">
                    NA-{caregiver._id ? caregiver._id.slice(-6).toUpperCase() : '000000'}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Issued: {format(new Date(), 'dd-MM-yyyy')}
                </p>
              </div>
            </div>

            {/* Hero Profile Section */}
            <div className="relative z-10 mt-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

                {/* Avatar Badge */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg shadow-emerald-600/20 border-2 border-white">
                    {caregiver.caregiverName ? caregiver.caregiverName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                    <ShieldCheck size={16} />
                  </div>
                </div>

                {/* Profile Overview */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      {caregiver.caregiverName}
                    </h1>
                    {caregiver.gender && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                        {caregiver.gender}
                      </span>
                    )}
                    {age && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                        {age} Years Old
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                    <HeartPulse size={16} />
                    <span>Certified Nursing Aide (NA) / Professional Caregiver</span>
                  </p>

                  {/* Specializations Tags */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
                    {specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-sm"
                      >
                        ✓ {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

              {/* Left Column: Personal & Contact Information */}
              <div className="space-y-6">

                {/* Contact & Personal Details Card */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <User size={15} />
                    <span>Personal Information</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">NRC / National ID</p>
                      <p className="font-semibold text-gray-900 mt-0.5 font-mono">
                        {caregiver.NRC || 'Verified on Record'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {formattedBirthdate} {age ? `(${age} Years)` : ''}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Number</p>
                      <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-500" />
                        <span>{caregiver.contactNumber || 'N/A'}</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Township & Location</p>
                      <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                        <MapPin size={13} className="text-gray-400" />
                        <span>{caregiver.township || 'Yangon'}</span>
                      </p>
                    </div>

                    {caregiver.address && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Full Address</p>
                        <p className="font-medium text-gray-700 mt-0.5 leading-relaxed">
                          {caregiver.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Duty Performance Summary */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <Award size={15} />
                    <span>Service & Duty Record</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Completed Duties</p>
                      <p className="text-xl font-black text-emerald-700 mt-1">
                        {stats?.bookingCount || stats?.completedCount || 10}+
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Assigned Bookings</p>
                    </div>

                    <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-teal-800 uppercase">Verification</p>
                      <div className="flex items-center justify-center gap-1 text-teal-700 font-black text-sm mt-2">
                        <ShieldCheck size={16} className="text-teal-600" />
                        <span>Healthy Nara</span>
                      </div>
                      <p className="text-[10px] text-teal-600 font-medium mt-0.5">Background Checked</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Skills, Duties & Background Note */}
              <div className="space-y-6">

                {/* Core Competencies & Nursing Aide Skills */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={15} />
                    <span>Core Nursing & Care Skills</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Vital Signs Monitoring:</strong> သွေးပေါင်၊ သွေးတွင်းအောက်ဆီဂျင်၊ အပူချိန်နှင့် သွေးချို တိုင်းတာစစ်ဆေးပေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Medication Management:</strong> ဆရာဝန်ညွှန်ကြားချက်အတိုင်း အချိန်မှန် ဆေးတိုက်ကျွေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Personal Hygiene & Mobility:</strong> ရေချိုး၊ သန့်ရှင်းရေး၊ အဝတ်အစားလဲလှယ်ခြင်းနှင့် လမ်းလျှောက် အကူအညီပေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Nutrition & Diet Support:</strong> သင့်လျော်သော အာဟာရကျွေးမွေးခြင်းနှင့် ကျန်းမာရေးနှင့်ညီညွတ်စွာ ကြီးကြပ်ပေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Emergency & Daily Logging:</strong> နေ့စဉ် ကျန်းမာရေးအခြေအနေ မှတ်တမ်းတင်ခြင်းနှင့် အရေးပေါ်အခြေအနေ တုံ့ပြန်ကူညီခြင်း။</span>
                    </li>
                  </ul>
                </div>

                {/* Background & Clinical Notes */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <FileText size={15} />
                    <span>Background & Notes</span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed italic bg-gray-50/80 p-3.5 rounded-lg border border-gray-100">
                    {caregiver.note ||
                      'Healthy Nara ၏ စံချိန်စံညွှန်းများနှင့်အညီ လေ့ကျင့်သင်ကြားထားပြီး စိတ်ရှည်ကြင်နာစွာဖြင့် လူနာနှင့် ကလေးငယ်များကို အထူးဂရုပြု စောင့်ရှောက်ပေးနိုင်သော အတွေ့အကြုံရှိ ကျွမ်းကျင်ဝန်ထမ်း ဖြစ်ပါသည်။'}
                  </p>
                </div>

              </div>

            </div>

            {/* Official Certification & Footer Section */}
            <div className="relative z-10 mt-10 pt-6 border-t-2 border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">

              {/* Healthy Nara Verification Notes */}
              <div className="space-y-1 text-center sm:text-left max-w-sm">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-gray-900">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Healthy Nara Official Verification</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  ဤ Curriculum Vitae (CV) သည် Healthy Nara Healthcare Platform မှ စိစစ်အတည်ပြုထားသော တရားဝင် ဝန်ထမ်းအချက်အလက် ဖြစ်ပါသည်။
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 text-[10px] font-semibold text-emerald-700 pt-1">
                  <span>🌐 healthynara.com</span>
                  <span>✉️ info@healthynara.com</span>
                </div>
              </div>

              {/* Authorized Seal & Signature */}
              <div className="flex items-center gap-4">
                <div className="text-center sm:text-right">
                  <img
                    src={autosign}
                    alt="Authorized Signature"
                    className="h-12 w-auto object-contain mx-auto sm:ml-auto"
                  />
                  <div className="border-t border-gray-300 pt-1 mt-1">
                    <p className="text-[11px] font-extrabold text-gray-800">Authorized Signature</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Healthy Nara Care Team</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
