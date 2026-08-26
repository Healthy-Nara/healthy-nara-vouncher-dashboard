import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminNAReportById, generateNAReportAISummary } from '../api';
import {
  ArrowLeft,
  Droplets,
  Baby,
  Moon,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  User,
  Printer,
  Sparkles,
  UtensilsCrossed,
  ShieldAlert,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  FileDown,
  Image as ImageIcon,
  Sun,
  Lightbulb,
  HeartPulse,
} from 'lucide-react';
import { downloadAsImage, downloadAsPDF } from '../utils/export';
import halogo from '../assets/halogo.png';
import patternBg from '../assets/pattern.png';
import autosign from '../assets/autosign.png';

const formatMyanmarDate = (dateStr?: string) => {
  if (!dateStr) return 'ရက်စွဲ မရှိပါ';
  try {
    const d = new Date(dateStr);
    const months = [
      'ဇန်နဝါရီလ',
      'ဖေဖော်ဝါရီလ',
      'မတ်လ',
      'ဧပြီလ',
      'မေလ',
      'ဇွန်လ',
      'ဇူလိုင်လ',
      'ဩဂုတ်လ',
      'စက်တင်ဘာလ',
      'အောက်တိုဘာလ',
      'နိုဝင်ဘာလ',
      'ဒီဇင်ဘာလ',
    ];
    const toMyanmarDigit = (num: number) => {
      const myanDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
      return String(num)
        .split('')
        .map((char) => myanDigits[parseInt(char)] || char)
        .join('');
    };

    const year = toMyanmarDigit(d.getFullYear());
    const month = months[d.getMonth()];
    const day = toMyanmarDigit(d.getDate());
    return `${year} ခုနှစ်၊ ${month} ${day} ရက်`;
  } catch {
    return dateStr;
  }
};

const NAReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'records' | 'aiSummary'>('records');
  const [recordsViewMode, setRecordsViewMode] = useState<'grid' | 'timeline'>('grid');
  const [copied, setCopied] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'png' | null>(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ['adminNAReport', id],
    queryFn: () => getAdminNAReportById(id!),
    enabled: !!id,
  });

  const aiSummaryMutation = useMutation({
    mutationFn: () => generateNAReportAISummary(id!),
    onSuccess: () => {
      setAiError(null);
      queryClient.invalidateQueries({ queryKey: ['adminNAReport', id] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to generate AI summary. Please check your API key in backend/.env';
      setAiError(msg);
    },
  });

  const handleCopy = () => {
    if (report?.aiSummary) {
      navigator.clipboard.writeText(report.aiSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading('pdf');
    try {
      const safeName = (report?.childName || 'Child').replace(/[\s/]+/g, '_');
      const safeDate = (report?.date ? new Date(report.date).toISOString().split('T')[0] : 'Date');
      await downloadAsPDF('ai-summary-voucher', `Care_Summary_${safeName}_${safeDate}`);
    } catch (e) {
      console.error(e);
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportPNG = async () => {
    setExportLoading('png');
    try {
      const safeName = (report?.childName || 'Child').replace(/[\s/]+/g, '_');
      const safeDate = (report?.date ? new Date(report.date).toISOString().split('T')[0] : 'Date');
      await downloadAsImage('ai-summary-voucher', `Care_Summary_${safeName}_${safeDate}`);
    } catch (e) {
      console.error(e);
    } finally {
      setExportLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin h-9 w-9 text-[#1cb89b]" />
        <p className="text-sm font-medium text-slate-500">Loading report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          The requested report could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/na-reports')}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-all cursor-pointer"
        >
          Back to Reports List
        </button>
      </div>
    );
  }

  const allRecords = report.records || [];
  const hygieneRecords = allRecords.filter((r: any) => r.category === 'Personal Hygiene');
  const nutritionRecords = allRecords.filter((r: any) => r.category === 'Nutrition and Feeding');
  const sleepRecords = allRecords.filter((r: any) => r.category === 'Sleeping');
  const activityRecords = allRecords.filter((r: any) => r.category === 'Activity and exercise');
  const incidentRecords = allRecords.filter((r: any) => r.category === 'Analysis and Unusual Findings');

  const reportDateFormatted = report.date
    ? new Date(report.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '-';

  const caregiverName =
    report.caregiver?.caregiverName ||
    report.caregiverName ||
    'Nurse Aid';

  const childName = report.childName || report.booking?.childName || 'Child';
  const customerName = report.booking?.customerName || 'Customer';
  const customerPhone = report.booking?.phoneNumber || '-';
  const serviceType = report.booking?.serviceType || 'Day Duty';

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/na-reports')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Daily Care Report
              </h1>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {serviceType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Report ID: <span className="font-mono text-slate-700">{report._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              report.status === 'submitted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {report.status === 'submitted' ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <Clock size={15} className="text-amber-600 shrink-0 animate-pulse" />
            )}
            <span>{report.status === 'submitted' ? 'Submitted' : 'In Progress (Draft)'}</span>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary Profile Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Child Info */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#1cb89b] flex items-center justify-center shrink-0 border border-teal-100">
            <Baby size={20} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Child Name
            </span>
            <p className="font-bold text-slate-900 text-sm truncate">{childName}</p>
            <span className="text-[11px] text-slate-400">{serviceType} Package</span>
          </div>
        </div>

        {/* Customer / Parent Info */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#1cb89b] flex items-center justify-center shrink-0 border border-teal-100">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer / Parent
            </span>
            <p className="font-bold text-slate-900 text-sm truncate">{customerName}</p>
            <span className="text-[11px] text-slate-400 font-mono">{customerPhone}</span>
          </div>
        </div>

        {/* Assigned Nurse Aid */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Nurse Aid
            </span>
            <p className="font-bold text-slate-900 text-sm truncate">{caregiverName}</p>
            <span className="text-[11px] text-indigo-600 font-bold">Verified Caregiver</span>
          </div>
        </div>

        {/* Date & Submissions */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar size={20} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Date
            </span>
            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">{reportDateFormatted}</p>
            <span className="text-[11px] text-slate-400 font-semibold">
              {allRecords.length} Logged Entries
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION TABS (Care Activity Records vs. AI Care Summary)              */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
              i
            </span>
            <span>Care Activity Records</span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                activeTab === 'records'
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {allRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aiSummary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'aiSummary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <Bot
              size={16}
              className={activeTab === 'aiSummary' ? 'text-teal-300' : 'text-teal-600'}
            />
            <span>AI Care Summary & Voucher</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'aiSummary'
                  ? 'bg-white text-teal-800'
                  : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}
            >
              {report.aiSummary ? 'Ready' : 'New'}
            </span>
          </button>
        </div>

        {/* View Layout Controls on the right */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            VIEW LAYOUT:
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('records');
                setRecordsViewMode('grid');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'records' && recordsViewMode === 'grid'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Category Cards
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('records');
                setRecordsViewMode('timeline');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'records' && recordsViewMode === 'timeline'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Activity Timeline ({allRecords.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CARE ACTIVITY RECORDS (CATEGORIZED CARDS & TIMELINE)               */}
      {/* ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Sub-toolbar inside Tab 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                View Layout:
              </span>
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRecordsViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    recordsViewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Category Cards
                </button>
                <button
                  type="button"
                  onClick={() => setRecordsViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    recordsViewMode === 'timeline'
                      ? 'bg-[#0d6d5c] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock size={13} />
                  <span>Activity Timeline ({allRecords.length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pr-1">
              <span>Total Recorded Events: <strong className="text-slate-900 font-mono font-bold">{allRecords.length}</strong></span>
            </div>
          </div>

          {/* 1. Timeline Focused View (Full Width) */}
          {recordsViewMode === 'timeline' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d6d5c] flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Chronological Activity Timeline
                    </h3>
                    <p className="text-xs text-slate-400">
                      All care logs recorded by Nurse Aid in sequence of time
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-teal-50 text-[#0d6d5c] font-bold text-xs rounded-full border border-teal-200 font-mono">
                  {allRecords.length} Events
                </span>
              </div>

              {allRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium">
                  No activity records logged yet
                </div>
              ) : (
                <div className="space-y-2 pt-2 max-w-3xl">
                  {allRecords.map((record: any, index: number) => {
                    let badgeBg = 'bg-teal-500';
                    let badgeBorder = 'border-teal-200';
                    let badgeText = 'text-teal-800';
                    let badgeLight = 'bg-teal-50';
                    let catLabel = 'Personal Hygiene';
                    if (record.category === 'Nutrition and Feeding') {
                      badgeBg = 'bg-amber-500';
                      badgeBorder = 'border-amber-200';
                      badgeText = 'text-amber-800';
                      badgeLight = 'bg-amber-50';
                      catLabel = 'Nutrition & Feeding';
                    } else if (record.category === 'Sleeping') {
                      badgeBg = 'bg-indigo-500';
                      badgeBorder = 'border-indigo-200';
                      badgeText = 'text-indigo-800';
                      badgeLight = 'bg-indigo-50';
                      catLabel = 'Sleeping';
                    } else if (record.category === 'Activity and exercise') {
                      badgeBg = 'bg-emerald-600';
                      badgeBorder = 'border-emerald-200';
                      badgeText = 'text-emerald-800';
                      badgeLight = 'bg-emerald-50';
                      catLabel = 'Activity & Exercise';
                    } else if (record.category === 'Analysis and Unusual Findings') {
                      badgeBg = 'bg-rose-500';
                      badgeBorder = 'border-rose-200';
                      badgeText = 'text-rose-800';
                      badgeLight = 'bg-rose-50';
                      catLabel = 'Unusual Finding / Incident';
                    }

                    const isLast = index === allRecords.length - 1;

                    return (
                      <div key={index} className="flex items-start gap-4 group">
                        {/* Centered Node & Connecting Vertical Line */}
                        <div className="flex flex-col items-center self-stretch shrink-0 w-5 pt-1">
                          <div
                            className={`w-3.5 h-3.5 rounded-full ${badgeBg} ring-4 ring-white shadow-xs shrink-0 z-10`}
                          />
                          {!isLast && (
                            <div className="w-0.5 bg-slate-200 flex-1 my-1" />
                          )}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 transition-all pb-3.5 mb-2">
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badgeLight} ${badgeText} ${badgeBorder}`}>
                              {catLabel}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                              Time: {record.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                            {record.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Category Cards View (Full Width) */}
          {recordsViewMode === 'grid' && (
            <div className="space-y-4">
              {/* Unusual Findings / Incident Card (Shows at Top if exists) */}
              {incidentRecords.length > 0 ? (
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldAlert size={16} />
                      </div>
                      <h3 className="font-bold text-rose-950 text-sm sm:text-base">
                        Analysis & Unusual Findings
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-300">
                      {incidentRecords.length} {incidentRecords.length === 1 ? 'Incident' : 'Incidents'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {incidentRecords.map((record: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100 font-mono">
                            Time: {record.time}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap mt-1">
                          {record.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 2x2 Grid for standard 4 categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Personal Hygiene */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0d6d5c] text-white flex items-center justify-center shrink-0">
                        <Droplets size={16} />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Personal Hygiene
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-teal-50 text-[#0d6d5c] font-bold text-xs rounded-full border border-teal-200">
                      {hygieneRecords.length}
                    </span>
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2">
                    {hygieneRecords.length > 0 ? (
                      hygieneRecords.map((record: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-mono">
                              {record.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {record.desc}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No hygiene records logged
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Nutrition & Feeding */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={16} />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Nutrition & Feeding
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                      {nutritionRecords.length}
                    </span>
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2">
                    {nutritionRecords.length > 0 ? (
                      nutritionRecords.map((record: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">
                              {record.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {record.desc}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No feeding records logged
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Sleeping */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                        <Moon size={16} />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Sleeping & Nap Time
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
                      {sleepRecords.length}
                    </span>
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2">
                    {sleepRecords.length > 0 ? (
                      sleepRecords.map((record: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                              {record.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {record.desc}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No sleeping records logged
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Activity & Exercise */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Activity size={16} />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Activity & Exercise
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                      {activityRecords.length}
                    </span>
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2">
                    {activityRecords.length > 0 ? (
                      activityRecords.map((record: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                              {record.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {record.desc}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No activity records logged
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI CARE SUMMARY & VOUCHER                                          */}
      {/* ========================================================================= */}
      {activeTab === 'aiSummary' && (
        <div className="space-y-4">
          {/* AI Clinical Care Summary Dark Green Container */}
          <div className="bg-[#0d6d5c] rounded-3xl p-5 sm:p-7 text-white shadow-md border border-teal-800/80">
            {/* Top Action Bar inside Dark Green Container */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center shrink-0 border border-white/15">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
                      AI Clinical Care Summary
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      AI POWERED
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Automated clinical analysis generated by OpenRouter AI / Google Gemini
                  </p>
                </div>
              </div>

              {/* Action Buttons on the Right */}
              <div className="flex items-center gap-2 flex-wrap">
                {report.aiSummary && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer border border-white/15"
                      title="Copy AI Summary"
                    >
                      {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPDF}
                      disabled={exportLoading !== null}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      {exportLoading === 'pdf' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileDown size={14} />
                      )}
                      <span>Export PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPNG}
                      disabled={exportLoading !== null}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer border border-white/15"
                    >
                      {exportLoading === 'png' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ImageIcon size={14} />
                      )}
                      <span>Export Image</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => aiSummaryMutation.mutate()}
                  disabled={aiSummaryMutation.isPending || allRecords.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    report.aiSummary
                      ? 'bg-slate-900/80 hover:bg-slate-900 text-white border border-white/15'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold'
                  } ${
                    aiSummaryMutation.isPending || allRecords.length === 0
                      ? 'opacity-60 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {aiSummaryMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Analyzing Care Logs...</span>
                    </>
                  ) : report.aiSummary ? (
                    <>
                      <RefreshCw size={14} />
                      <span>Regenerate</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} />
                      <span>Generate AI Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="mt-4 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-300" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Main Content Area */}
            {aiSummaryMutation.isPending ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300 animate-pulse">
                  <Sparkles size={24} />
                </div>
                <p className="text-sm font-bold text-white">
                  Generating comprehensive clinical summary with AI...
                </p>
                <p className="text-xs text-emerald-100/70 max-w-md">
                  Analyzing hygiene, nutrition, sleeping, and behavioral activities logged for {childName}.
                </p>
              </div>
            ) : report.aiSummary ? (
              /* Inner White Paper Container (Matches screenshot precisely) */
              <div className="mt-5 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-9 text-slate-800 shadow-sm border border-slate-100">
                <ClinicalReportPaper
                  summaryText={report.aiSummary}
                  childName={childName}
                  date={report.date}
                />
              </div>
            ) : (
              <div className="mt-5 bg-white/10 border border-white/15 rounded-2xl p-10 text-center space-y-3">
                <Sparkles className="w-10 h-10 mx-auto text-emerald-300/80" />
                <h3 className="text-base font-bold text-white">
                  No AI Summary Generated Yet
                </h3>
                <p className="text-xs text-emerald-100/80 max-w-md mx-auto">
                  Click <strong>"Generate AI Summary"</strong> to produce an instant clinical synthesis of the child's daily care and milestones.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden container strictly for PDF / Image Export */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', zIndex: -100 }}>
        <VoucherElement
          report={report}
          childName={childName}
          customerName={customerName}
          customerPhone={customerPhone}
          caregiverName={caregiverName}
          serviceType={serviceType}
          reportDateFormatted={reportDateFormatted}
        />
      </div>
    </div>
  );
};

// ============================================================================
// CLINICAL REPORT PAPER COMPONENT (Standardized layout matching UI Screenshot)
// ============================================================================
interface ClinicalReportPaperProps {
  summaryText: string;
  childName: string;
  date?: string;
  isVoucher?: boolean;
}

const ClinicalReportPaper = ({
  summaryText,
  childName,
  date,
  isVoucher = false,
}: ClinicalReportPaperProps) => {
  if (!summaryText) return null;

  const lines = summaryText.split('\n');
  const sections: {
    type: 'executive' | 'activity' | 'clinical' | 'recommendations' | 'general';
    title: string;
    paragraphs: string[];
    bullets: string[];
  }[] = [];

  let currentSection: (typeof sections)[0] = {
    type: 'executive',
    title: 'နေ့စဉ် ပြုစုစောင့်ရှောက်မှု အကျဉ်းချုပ် (EXECUTIVE SUMMARY)',
    paragraphs: [],
    bullets: [],
  };

  const isHeaderLine = (line: string) => {
    const l = line.trim();
    if (!l) return false;
    if (l.startsWith('#')) return true;
    if (
      /^[0-9]+[\.\)]\s+/.test(l) &&
      (l.includes('**') ||
        l.includes('အကျဉ်းချုပ်') ||
        l.includes('မှတ်တမ်း') ||
        l.includes('ကျန်းမာရေး') ||
        l.includes('အကြံပြုချက်') ||
        l.includes('လှုပ်ရှားမှု'))
    )
      return true;
    if (l.startsWith('**') && l.endsWith('**') && l.length > 5 && !l.includes(':**')) return true;
    if (l.includes('Executive Summary') || l.includes('EXECUTIVE SUMMARY') || l.includes('အကျဉ်းချုပ်'))
      return true;
    if (
      l.includes('Activities & Mood') ||
      l.includes('ACTIVITIES & MOOD') ||
      l.includes('ကစားလှုပ်ရှားမှု') ||
      l.includes('ကလေးလှုပ်ရှားမှု') ||
      l.includes('Care Highlights')
    )
      return true;
    if (
      l.includes('Clinical Observations') ||
      l.includes('CLINICAL OBSERVATIONS') ||
      l.includes('Unusual Findings') ||
      l.includes('ကျန်းမာရေး စောင့်ကြည့်စစ်ဆေးချက်')
    )
      return true;
    if (l.includes('Recommendations') || l.includes('RECOMMENDATIONS') || l.includes('အကြံပြုချက်များ'))
      return true;
    return false;
  };

  const determineSectionType = (
    title: string
  ): 'executive' | 'activity' | 'clinical' | 'recommendations' | 'general' => {
    const t = title.toLowerCase();
    if (t.includes('executive') || t.includes('အကျဉ်းချုပ်')) return 'executive';
    if (
      t.includes('activit') ||
      t.includes('mood') ||
      t.includes('highlight') ||
      t.includes('လှုပ်ရှားမှု') ||
      t.includes('စိတ်ခံစားမှု') ||
      t.includes('အာဟာရ') ||
      t.includes('သန့်ရှင်းရေး')
    )
      return 'activity';
    if (
      t.includes('clinical') ||
      t.includes('observation') ||
      t.includes('unusual') ||
      t.includes('finding') ||
      t.includes('ကျန်းမာရေး') ||
      t.includes('ထူးခြားဖြစ်စဉ်')
    )
      return 'clinical';
    if (t.includes('recommend') || t.includes('အကြံပြုချက်')) return 'recommendations';
    return 'general';
  };

  const cleanHeaderTitle = (title: string): string => {
    return title
      .replace(/^#{1,4}\s+/, '')
      .replace(/^[0-9]+[\.\)]\s+/, '')
      .replace(/^\*+\s*/, '')
      .replace(/\*+$/, '')
      .replace(/^[🌟📋🔍💡🩺⚙️🍲🧼🛌🎨]+\s*/, '')
      .trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Skip redundant top document headers
    if (
      line.includes('Healthy Nara') ||
      line.includes('နေ့စဉ် ပြုစုစောင့်ရှောက်မှု အကျဉ်းချုပ် အစီရင်ခံစာ') ||
      line.startsWith('ကလေးအမည်:') ||
      line.startsWith('ရက်စွဲ:') ||
      line === '---' ||
      line === '***'
    ) {
      continue;
    }

    if (isHeaderLine(line)) {
      if (currentSection.paragraphs.length > 0 || currentSection.bullets.length > 0) {
        sections.push(currentSection);
      }
      const cleaned = cleanHeaderTitle(line);
      const sType = determineSectionType(cleaned);
      currentSection = {
        type: sType,
        title: cleaned,
        paragraphs: [],
        bullets: [],
      };
    } else if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      currentSection.bullets.push(line.replace(/^[\*\-•]\s+/, '').trim());
    } else if (/^[0-9]+[\.\)]\s+/.test(line)) {
      currentSection.bullets.push(line.replace(/^[0-9]+[\.\)]\s+/, '').trim());
    } else {
      currentSection.paragraphs.push(line);
    }
  }

  if (currentSection.paragraphs.length > 0 || currentSection.bullets.length > 0) {
    sections.push(currentSection);
  }

  const getSectionConfig = (type: string, title: string) => {
    switch (type) {
      case 'executive':
        return {
          icon: <Sun size={13} className="text-amber-700" />,
          iconBg: 'bg-amber-100',
          borderAccent: 'border-amber-300',
          defaultTitle: 'နေ့စဉ် ပြုစုစောင့်ရှောက်မှု အကျဉ်းချုပ် (EXECUTIVE SUMMARY)',
          isItalic: true,
        };
      case 'activity':
        return {
          icon: <Baby size={13} className="text-emerald-700" />,
          iconBg: 'bg-emerald-100',
          borderAccent: 'border-emerald-300',
          defaultTitle: 'ကလေးလှုပ်ရှားမှုနှင့် စိတ်ခံစားမှု (ACTIVITIES & MOOD)',
          isItalic: false,
        };
      case 'clinical':
        return {
          icon: <HeartPulse size={13} className="text-rose-700" />,
          iconBg: 'bg-rose-100',
          borderAccent: 'border-rose-300',
          defaultTitle:
            'ကျန်းမာရေး စောင့်ကြည့်စစ်ဆေးချက်နှင့် ထူးခြားဖြစ်စဉ်များ (CLINICAL OBSERVATIONS & UNUSUAL FINDINGS)',
          isItalic: false,
        };
      case 'recommendations':
        return {
          icon: <Lightbulb size={13} className="text-indigo-700" />,
          iconBg: 'bg-indigo-100',
          borderAccent: 'border-indigo-300',
          defaultTitle: 'မိဘများနှင့် နောက်တာဝန်ကျ ဆရာမအတွက် အကြံပြုချက်များ (RECOMMENDATIONS)',
          isItalic: false,
        };
      default:
        return {
          icon: <Activity size={13} className="text-teal-700" />,
          iconBg: 'bg-teal-100',
          borderAccent: 'border-teal-300',
          defaultTitle: title,
          isItalic: false,
        };
    }
  };

  return (
    <div className={`space-y-6 font-sans ${isVoucher ? 'text-slate-800' : 'text-slate-800'}`}>
      {/* Top Document Header matching UI Screenshot */}
      <div className="space-y-2.5 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-[#0d6d5c] tracking-tight border-b-2 border-[#0d6d5c] pb-0.5 inline-block">
            Healthy Nara (ကလေးသူငယ်နှင့် မိသားစု ကျန်းမာရေး ပြုစုစောင့်ရှောက်မှု အဖွဲ့)
          </h2>
        </div>
        <div className="space-y-0.5 pt-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
            နေ့စဉ် ပြုစုစောင့်ရှောက်မှု အကျဉ်းချုပ် အစီရင်ခံစာ
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ကလေးအမည်: <span className="font-bold text-slate-900">{childName}</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ရက်စွဲ: <span className="font-bold text-slate-900">{formatMyanmarDate(date)}</span>
          </p>
        </div>
      </div>

      {/* Rendered Sections */}
      <div className="space-y-5">
        {sections.map((section, idx) => {
          const config = getSectionConfig(section.type, section.title);
          const displayTitle = section.title || config.defaultTitle;

          return (
            <div key={idx} className="space-y-2">
              {/* Section Header with Icon Box */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}
                >
                  {config.icon}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  {displayTitle}
                </h4>
              </div>

              {/* Section Paragraphs with left accent line */}
              {section.paragraphs.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className={`border-l-2 ${config.borderAccent} pl-3.5 my-2 text-xs sm:text-sm text-slate-700 leading-relaxed ${
                    config.isItalic ? 'italic font-medium' : 'font-normal'
                  }`}
                >
                  <InlineMarkdown text={p} />
                </div>
              ))}

              {/* Section Bullets */}
              {section.bullets.length > 0 && (
                <ul className="space-y-2 pl-2 pt-0.5">
                  {section.bullets.map((b, bIdx) => (
                    <li
                      key={bIdx}
                      className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed"
                    >
                      <span className="text-slate-400 font-bold text-base leading-none select-none">
                        •
                      </span>
                      <div className="flex-1">
                        <InlineMarkdown text={b} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// VOUCHER / RECEIPT TEMPLATE (A4 Sized Container for PDF / Image Export)
// ============================================================================
interface VoucherProps {
  report: any;
  childName: string;
  customerName: string;
  customerPhone: string;
  caregiverName: string;
  serviceType: string;
  reportDateFormatted: string;
}

const VoucherElement = ({
  report,
  childName,
  customerName,
  customerPhone,
  caregiverName,
  serviceType,
  reportDateFormatted,
}: VoucherProps) => {
  return (
    <div
      id="ai-summary-voucher"
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#ffffff',
        padding: '44px 48px',
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: '#1f2937',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Background Decorative Pattern Top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          backgroundColor: '#0d6d5c',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      />

      {/* Full Background Watermark Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${patternBg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '480px',
          opacity: 0.28,
          pointerEvents: 'none',
          borderRadius: '16px',
        }}
      />

      {/* Content wrapper above watermark */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header: Company Brand + Reference */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '20px',
            borderBottom: '2px solid #f3f4f6',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={halogo}
              alt="Healthy Nara Logo"
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                borderRadius: '10px',
              }}
            />
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0d6d5c',
                  letterSpacing: '-0.5px',
                  margin: 0,
                  lineHeight: '1.2',
                }}
              >
                Healthy Nara
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  margin: '2px 0 0 0',
                  fontWeight: 500,
                }}
              >
                Pediatric & Home Health Care Management
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#0d6d5c',
                margin: '0 0 3px 0',
              }}
            >
              REF: {report._id?.substring(0, 16).toUpperCase()}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#6b7280',
                margin: 0,
                fontWeight: 500,
              }}
            >
              Date: {reportDateFormatted}
            </p>
          </div>
        </div>

        {/* Voucher Info Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
          }}
        >
          {/* Child */}
          <div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Child Information
            </span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 2px 0',
              }}
            >
              {childName}
            </p>
            <span
              style={{
                fontSize: '11px',
                color: '#0d6d5c',
                fontWeight: 600,
              }}
            >
              {serviceType} Service
            </span>
          </div>

          {/* Customer / Parent */}
          <div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Parent / Customer
            </span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 2px 0',
              }}
            >
              {customerName}
            </p>
            <span
              style={{
                fontSize: '11px',
                color: '#6b7280',
                fontFamily: 'monospace',
              }}
            >
              Ph: {customerPhone}
            </span>
          </div>

          {/* Caregiver */}
          <div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Assigned Nurse Aid
            </span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 2px 0',
              }}
            >
              {caregiverName}
            </p>
            <span
              style={{
                fontSize: '11px',
                color: '#4f46e5',
                fontWeight: 600,
              }}
            >
              Status: {report.status === 'submitted' ? 'Verified' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* AI Clinical Care Analysis Box in Voucher */}
        {report.aiSummary && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <ClinicalReportPaper
              summaryText={report.aiSummary}
              childName={childName}
              date={report.date}
              isVoucher={true}
            />
          </div>
        )}

        {/* Footer & Signature Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {/* Left: Security & Disclaimer */}
          <div style={{ maxWidth: '380px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0d6d5c' }}>
                Healthy Nara Quality Assurance
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
              This care voucher is electronically synthesized and verified for pediatric home care supervision.
            </p>
          </div>

          {/* Right: Signature & Stamp */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div
              style={{
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '2px',
              }}
            >
              <img
                src={autosign}
                alt="Authorized Signature"
                style={{ width: '90px', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                width: '160px',
                height: '1px',
                backgroundColor: '#9ca3af',
                margin: '0 auto 4px auto',
              }}
            />
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', margin: '0 0 2px 0' }}>
              Clinical Supervisor
            </p>
            <p style={{ fontSize: '9.5px', color: '#6b7280', margin: 0 }}>
              Healthy Nara Clinical Operations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for parsing inline bold `**text**` and formatting
const InlineMarkdown = ({ text }: { text: string }) => {
  if (!text) return null;

  // Split by bold pattern `**something**`
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-slate-900">
              {boldText}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default NAReportDetail;
