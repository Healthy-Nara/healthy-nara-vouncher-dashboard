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
} from 'lucide-react';

const NAReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
        'Failed to generate AI summary. Please check your GEMINI_API_KEY in backend/.env';
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
  const serviceType = report.booking?.serviceType || 'Day Duty';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/na-reports')}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-slate-900 cursor-pointer border border-slate-200"
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Daily Care Report
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {serviceType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Report ID: <span className="font-mono text-slate-700">{report._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
              report.status === 'submitted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {report.status === 'submitted' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <Clock size={16} className="text-amber-600 shrink-0 animate-pulse" />
            )}
            <span>{report.status === 'submitted' ? 'Submitted' : 'In Progress (Draft)'}</span>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary Profile Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Child Info */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#1cb89b] flex items-center justify-center shrink-0 border border-teal-100">
            <Baby size={24} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Child Name
            </span>
            <p className="font-bold text-slate-900 text-base truncate">{childName}</p>
            <span className="text-xs text-slate-500">{serviceType} Package</span>
          </div>
        </div>

        {/* Assigned Nurse Aid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <User size={24} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Assigned Nurse Aid
            </span>
            <p className="font-bold text-slate-900 text-base truncate">{caregiverName}</p>
            <span className="text-xs text-indigo-600 font-medium">Verified Caregiver</span>
          </div>
        </div>

        {/* Report Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar size={24} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Date
            </span>
            <p className="font-bold text-slate-900 text-sm truncate leading-snug">{reportDateFormatted}</p>
            <span className="text-xs text-slate-500">
              {report.submittedAt
                ? `Submitted: ${new Date(report.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Total Records Recorded */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Total Logged Entries
            </span>
            <p className="font-bold text-slate-900 text-base">
              {allRecords.length} <span className="text-xs font-normal text-slate-500">Entries</span>
            </p>
            <span className="text-xs text-emerald-600 font-medium">
              {incidentRecords.length > 0 ? `⚠️ ${incidentRecords.length} Incidents` : 'Normal / Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AI CARE SUMMARY CARD (GOOGLE GEMINI AI STUDIO)                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-500/20 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#1cb89b]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1cb89b] to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Bot size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    AI Clinical Care Summary
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-400/20 text-teal-300 border border-teal-400/30">
                      Gemini 2.5
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-300">
                  Automated clinical analysis generated by Google AI Studio
                </p>
              </div>
            </div>

            {/* Action Buttons: Generate / Regenerate / Copy */}
            <div className="flex items-center gap-2 flex-wrap">
              {report.aiSummary && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer border border-white/10"
                  title="Copy AI Summary"
                >
                  {copied ? <Check size={14} className="text-teal-300" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => aiSummaryMutation.mutate()}
                disabled={aiSummaryMutation.isPending || allRecords.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  report.aiSummary
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-gradient-to-r from-[#1cb89b] to-indigo-500 hover:from-[#17a58b] hover:to-indigo-600 text-white'
                } ${
                  aiSummaryMutation.isPending || allRecords.length === 0
                    ? 'opacity-60 cursor-not-allowed'
                    : ''
                }`}
              >
                {aiSummaryMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white" />
                    <span>Analyzing Care Logs...</span>
                  </>
                ) : report.aiSummary ? (
                  <>
                    <RefreshCw size={14} />
                    <span>Regenerate Summary</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>Generate AI Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error message banner if any */}
          {aiError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Summary Content Body */}
          {aiSummaryMutation.isPending ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-300 animate-pulse">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-semibold text-white">
                Generating comprehensive care overview with Gemini AI...
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                Analyzing all hygiene, nutrition, sleeping, and behavioral activities logged for {childName}.
              </p>
            </div>
          ) : report.aiSummary ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                {report.aiSummary}
              </div>
              {report.aiSummaryGeneratedAt && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>
                    Generated on {new Date(report.aiSummaryGeneratedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-teal-400 font-medium">
                    ✓ You can regenerate anytime after updating records
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-teal-300/80" />
              <h3 className="text-sm font-bold text-white">
                No AI Summary Generated Yet
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Click <strong>"Generate AI Summary"</strong> to produce an instant clinical synthesis of the child's daily nutrition, rest, hygiene, and milestones.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CATEGORIZED CARDS (2 Columns on Desktop)                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 space-y-5">
          {/* Unusual Findings / Incident Card (Shows at Top if exists) */}
          {incidentRecords.length > 0 ? (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldAlert size={18} />
                  </div>
                  <h3 className="font-bold text-rose-950 text-base">
                    Analysis & Unusual Findings
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-300">
                  {incidentRecords.length} {incidentRecords.length === 1 ? 'Incident' : 'Incidents'}
                </span>
              </div>
              <div className="space-y-2.5">
                {incidentRecords.map((record: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100 font-mono">
                        Time: {record.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap mt-1">
                      {record.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 2x2 Grid for standard 4 categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Personal Hygiene */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1cb89b] text-white flex items-center justify-center shrink-0">
                    <Droplets size={17} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Personal Hygiene
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-[#1cb89b] font-bold text-xs rounded-full border border-teal-200">
                  {hygieneRecords.length}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2.5">
                {hygieneRecords.length > 0 ? (
                  hygieneRecords.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-mono">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
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
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <UtensilsCrossed size={17} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Nutrition & Feeding
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                  {nutritionRecords.length}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2.5">
                {nutritionRecords.length > 0 ? (
                  nutritionRecords.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
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
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <Moon size={17} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Sleeping & Nap Time
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
                  {sleepRecords.length}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2.5">
                {sleepRecords.length > 0 ? (
                  sleepRecords.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
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
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Activity size={17} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Activity & Exercise
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                  {activityRecords.length}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2.5">
                {activityRecords.length > 0 ? (
                  activityRecords.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
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

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CHRONOLOGICAL ACTIVITY TIMELINE                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs sticky top-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="text-[#1cb89b]" size={18} />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Activity Timeline
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono">
              ({allRecords.length} Logs)
            </span>
          </div>

          {allRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No activity records logged yet
            </div>
          ) : (
            <div className="space-y-1">
              {allRecords.map((record: any, index: number) => {
                let badgeBg = 'bg-teal-500';
                let catLabel = 'Hygiene';
                if (record.category === 'Nutrition and Feeding') {
                  badgeBg = 'bg-amber-500';
                  catLabel = 'Nutrition';
                } else if (record.category === 'Sleeping') {
                  badgeBg = 'bg-indigo-500';
                  catLabel = 'Sleeping';
                } else if (record.category === 'Activity and exercise') {
                  badgeBg = 'bg-emerald-600';
                  catLabel = 'Activity';
                } else if (record.category === 'Analysis and Unusual Findings') {
                  badgeBg = 'bg-rose-500';
                  catLabel = 'Incident';
                }

                const isLast = index === allRecords.length - 1;

                return (
                  <div key={index} className="flex items-start gap-3.5 group">
                    {/* Centered Node & Connecting Vertical Line */}
                    <div className="flex flex-col items-center self-stretch shrink-0 w-4 pt-1">
                      {/* Circle Dot */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${badgeBg} ring-4 ring-white shadow-2xs shrink-0 z-10`}
                      />
                      {/* Vertical Stick / Connector */}
                      {!isLast && (
                        <div className="w-0.5 bg-slate-200 flex-1 my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {catLabel}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
                        {record.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NAReportDetail;
