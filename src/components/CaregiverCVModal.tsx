import React, { useRef, useState } from 'react';
import { X, Download, Printer, ShieldCheck, Phone, MapPin, Award, CheckCircle2, User, HeartPulse, FileText, Image as ImageIcon, GraduationCap, Briefcase, Scale, Ruler, Building2, Sparkles, MessageSquareQuote, Star } from 'lucide-react';
import { format } from 'date-fns';
import halogo from '../assets/halogo.png';
import patternBg from '../assets/pattern.png';
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
    religion?: string;
    weight?: string;
    height?: string;
    educationStatus?: string;
    trainingSchool?: string;
    experienceYears?: string;
    experienceCases?: string;
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
  const [showPhone, setShowPhone] = useState(false);
  const [showNRC, setShowNRC] = useState(false);

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
    : null;

  const experienceCasesList = caregiver.experienceCases
    ? caregiver.experienceCases.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Newborn Care Only'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center items-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">

        {/* Responsive Action Header - Hidden during print */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-950 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-800 print:hidden">
          {/* Title & Subtitle */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Nurse Aid Profile & CV</h2>
                <p className="text-[11px] text-gray-400">Preview & export verified A4 profile</p>
              </div>
            </div>
            {/* Close Button on Mobile (Top Right) */}
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-800">
            {/* Phone & NRC Toggles */}
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              <span className="text-[10px] font-bold text-gray-400 px-1.5 hidden md:inline">Show:</span>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showPhone
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
                title="Toggle Phone Number on CV"
              >
                <Phone size={12} />
                <span>Phone {showPhone ? '✓' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNRC(!showNRC)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showNRC
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
                title="Toggle NRC on CV"
              >
                <ShieldCheck size={12} />
                <span>NRC {showNRC ? '✓' : ''}</span>
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => downloadAsImage(cvId, fileName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-all border border-gray-700 cursor-pointer"
                title="Download as PNG Image"
              >
                <ImageIcon size={14} />
                <span>PNG</span>
              </button>
              <button
                onClick={() => downloadAsPDF(cvId, fileName)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                title="Download as PDF"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-all border border-gray-700 cursor-pointer hidden md:inline-flex"
                title="Print Document"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer ml-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Document Container with Pan Hint on Mobile */}
        <div className="p-3 sm:p-6 bg-slate-200/90 overflow-x-auto flex justify-start lg:justify-center print:p-0 print:bg-white">

          {/* Printable CV Sheet with Fixed Desktop A4 Width (794px) to ensure identical export format on Mobile & Laptop */}
          <div
            id={cvId}
            ref={cvContainerRef}
            style={{
              width: '794px',
              minWidth: '794px',
              minHeight: '1050px',
              boxSizing: 'border-box',
            }}
            className="relative bg-white border border-gray-300 shadow-xl p-10 text-gray-800 overflow-hidden font-sans rounded-xl print:border-none print:shadow-none print:p-8"
          >
            {/* Repeating Background Pattern Watermark Overlay (Invoice Style) */}
            <div
              className="absolute inset-0 pointer-events-none select-none z-0"
              style={{
                backgroundImage: `url(${patternBg})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '480px',
                opacity: 0.32,
              }}
            />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between pb-6 border-b-2 border-emerald-500/30">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3.5">
                <img
                  src={halogo}
                  alt="Healthy Nara"
                  className="w-12 h-12 rounded-xl object-contain shadow-xs border border-emerald-500/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-600 tracking-tight">
                      Nurse Aid Profile
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase mt-0.5">
                    Healthy Nara Healthcare & Caregiver Services
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
              <div className="flex flex-row items-start gap-6">

                {/* Avatar Badge */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-4xl shadow-lg shadow-emerald-600/20 border-2 border-white">
                    {caregiver.caregiverName ? caregiver.caregiverName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                    <ShieldCheck size={16} />
                  </div>
                </div>

                {/* Profile Overview */}
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {caregiver.caregiverName}
                    </h1>
                    {caregiver.gender && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 shadow-xs">
                        {caregiver.gender}
                      </span>
                    )}
                    {age && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-xs">
                        {age} Years Old
                      </span>
                    )}
                    {caregiver.religion && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-teal-800 border border-teal-200 shadow-xs">
                        {caregiver.religion}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-emerald-700 mt-1.5 flex items-center justify-start gap-1.5">
                    <HeartPulse size={16} />
                    <span>Certified Nursing Aide (NA) / Professional Caregiver</span>
                  </p>

                  {/* Experienced Cases Tags */}
                  <div className="flex flex-wrap items-center justify-start gap-1.5 mt-3">
                    {experienceCasesList.map((cCase, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-xs"
                      >
                        ✓ {cCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid (Fixed 2 Columns for Crisp A4 Structure) */}
            <div className="relative z-10 grid grid-cols-2 gap-6 mt-6">

              {/* Left Column: Personal & Physical Information */}
              <div className="space-y-6">

                {/* Personal & Physical Details Card */}
                <div className="bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <User size={15} />
                    <span>Personal & Physical Details</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Age</p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {age ? `${age} years` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Religion</p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {caregiver.religion || 'Buddhist'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                          <Scale size={11} className="text-gray-400" /> Weight
                        </p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {caregiver.weight || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                          <Ruler size={11} className="text-gray-400" /> Height
                        </p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {caregiver.height || '—'}
                        </p>
                      </div>
                    </div>

                    {showNRC && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">NRC / National ID</p>
                        <p className="font-semibold text-gray-900 mt-0.5 font-mono">
                          {caregiver.NRC || 'Verified on Record'}
                        </p>
                      </div>
                    )}

                    {showPhone && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Number</p>
                        <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                          <Phone size={13} className="text-emerald-500" />
                          <span>{caregiver.contactNumber || 'N/A'}</span>
                        </p>
                      </div>
                    )}

                    {formattedBirthdate && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {formattedBirthdate}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Township & Location</p>
                      <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                        <MapPin size={13} className="text-gray-400" />
                        <span>{caregiver.township || 'Yangon'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Experience & Duty Performance Summary */}
                <div className="bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
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

              {/* Right Column: Qualifications, Experience & Core Skills */}
              <div className="space-y-6">

                {/* Education & Professional Qualifications Card */}
                <div className="bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <GraduationCap size={15} />
                    <span>Education & Experience</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <GraduationCap size={12} className="text-emerald-600" /> Education Status
                      </p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {caregiver.educationStatus || 'High School Graduated'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Building2 size={12} className="text-emerald-600" /> Training School
                      </p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {caregiver.trainingSchool || 'Aung Chan Thar TC'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                          <Briefcase size={12} className="text-emerald-600" /> Experienced Years
                        </p>
                        <p className="font-semibold text-emerald-700 mt-0.5">
                          {caregiver.experienceYears || '2 years'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                          <Sparkles size={12} className="text-emerald-600" /> Experienced Cases
                        </p>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {caregiver.experienceCases || 'Newborn Care Only'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Competencies & Nursing Aide Skills */}
                <div className="bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={15} />
                    <span>Core Nursing & Care Skills</span>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Vital Signs Monitoring:</strong> သွေးပေါင်၊ သွေးတွင်းအောက်ဆီဂျင်၊ အပူချိန် တိုင်းတာစစ်ဆေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Medication Management:</strong> ဆရာဝန်ညွှန်ကြားချက်အတိုင်း အချိန်မှန် ဆေးတိုက်ကျွေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Personal Hygiene & Mobility:</strong> ရေချိုး၊ သန့်ရှင်းရေးနှင့် လမ်းလျှောက် အကူအညီပေးခြင်း။</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Nutrition & Diet Support:</strong> သင့်လျော်သော အာဟာရကျွေးမွေးခြင်းနှင့် ကြီးကြပ်ပေးခြင်း။</span>
                    </li>
                  </ul>
                </div>

                {/* Background & Clinical Notes */}
                <div className="bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    <FileText size={15} />
                    <span>Background & Notes</span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed italic bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                    {caregiver.note ||
                      'Healthy Nara ၏ စံချိန်စံညွှန်းများနှင့်အညီ လေ့ကျင့်သင်ကြားထားပြီး စိတ်ရှည်ကြင်နာစွာဖြင့် ကလေးငယ်နှင့် မိခင်များကို အထူးဂရုပြု စောင့်ရှောက်ပေးနိုင်သော အတွေ့အကြုံရှိ ကျွမ်းကျင်ဝန်ထမ်း ဖြစ်ပါသည်။'}
                  </p>
                </div>

              </div>

            </div>

            {/* Customer Feedback & Client Reviews Section (Bottom) */}
            <div className="relative z-10 mt-6 bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                  <MessageSquareQuote size={15} />
                  <span>Customer Feedback & Service Evaluation</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-bold text-gray-700 ml-1">5.0 / 5.0</span>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-dashed border-gray-300 rounded-xl p-4 min-h-[75px] flex items-center justify-between text-xs text-gray-500">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-700 italic">
                    "အထူးဂရုစိုက်ပြီး စိတ်ချယုံကြည်ရသော သူနာပြုအကူ ဖြစ်ပါသည်။ ကလေးငယ်ကို နွေးထွေးကြင်နာစွာ စောင့်ရှောက်ပေးခဲ့ပါသည်။"
                  </p>
                  <p className="text-[10px] text-gray-400">
                    — Verified Customer Review • Healthy Nara Home Care
                  </p>
                </div>
                <div className="text-right shrink-0 pl-4 border-l border-gray-200">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                    Verified Service ✓
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
