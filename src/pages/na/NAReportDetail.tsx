import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getNAReportById } from '../../api';
import { 
  ArrowLeft, Edit, Droplets, Baby, Moon, Activity, 
  AlertCircle, CheckCircle2, Clock, Loader2
} from 'lucide-react';

const NAReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery({
    queryKey: ['naReport', id],
    queryFn: () => getNAReportById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <p className="text-gray-500">Report ရှာမတွေ့ပါ</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('my-MM', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-primary/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/na')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">Report အသေးစိတ်</h1>
            <p className="text-xs text-gray-500">{report.childName}</p>
          </div>
          {report.status === 'draft' && (
            <button
              onClick={() => navigate(`/na/report/${report._id}`)}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Badge */}
        <div className={`flex items-center gap-2 p-4 rounded-xl ${
          report.status === 'submitted' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {report.status === 'submitted' ? (
            <CheckCircle2 className="text-green-600" size={20} />
          ) : (
            <Clock className="text-yellow-600" size={20} />
          )}
          <div>
            <p className={`font-semibold ${
              report.status === 'submitted' ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {report.status === 'submitted' ? 'ပေးပို့ပြီး' : 'မဖြည့်သေးပါ'}
            </p>
            {report.submittedAt && (
              <p className="text-xs text-green-600">
                ပေးပို့ချိန်: {new Date(report.submittedAt).toLocaleString('my-MM')}
              </p>
            )}
          </div>
        </div>

        {/* Nutrition & Feeding */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">အာဟာရနှင့် အစာကျွေးခြင်း</h2>
          </div>

          {report.feedingRecords?.length > 0 ? (
            <div className="space-y-3">
              {report.feedingRecords.map((record: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {record.type === 'breast_milk' ? 'မိခင်နို့' : 'ဖော်စပ်နို့'}
                    </span>
                    <span className="text-sm text-gray-500">{record.amount}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>အချိန်: {formatTime(record.time)}</span>
                    {record.burpingDone && <span className="text-green-600">✓ နို့တိုက်ပြီး</span>}
                    {record.airReleased && <span className="text-green-600">✓ လေထုတ်ပြီး</span>}
                    {record.spitUp && <span className="text-red-600">✓ နို့အန်</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">အစာကျွေးချိန် မရှိပါ</p>
          )}

          {report.supplementaryFood && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">ဖြည့်စွက်စာ</p>
              <p className="text-sm">{report.supplementaryFood}</p>
            </div>
          )}
        </div>

        {/* Personal Hygiene */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">တစ်ကိုယ်ရည် သန့်ရှင်းရေး</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">ရေချိုးချိန်</p>
              <p className="text-sm font-medium">{formatTime(report.hygiene?.bathTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ရေချိုးနည်း</p>
              <p className="text-sm font-medium">
                {report.hygiene?.bathType === 'bath' ? 'ရေချိုးခြင်း' : 
                 report.hygiene?.bathType === 'sponge_bath' ? 'ရေပတ်တိုက်ခြင်း' : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Diaper လဲလှယ်ချိန်</p>
              <p className="text-sm font-medium">{report.hygiene?.diaperChanges || 0} အကိမ်</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ဆီးပူ/ဝမ်းပူမိခြင်း</p>
              <p className={`text-sm font-medium ${report.hygiene?.rashCheck ? 'text-red-600' : 'text-green-600'}`}>
                {report.hygiene?.rashCheck ? 'ရှိ' : 'မရှိ'}
              </p>
            </div>
          </div>
        </div>

        {/* Sleeping */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">အိပ်ချိန်</h2>
          </div>

          {report.sleepRecords?.length > 0 ? (
            <div className="space-y-3">
              {report.sleepRecords.map((record: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {record.type === 'day' ? 'နေ့ဘက်' : 'ညဘက်'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.onSchedule ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {record.onSchedule ? 'အချိန်မှန်' : 'အချိန်မမှန်'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>အိပ်ချိန်: {formatTime(record.startTime)}</span>
                    <span>နိုးချိန်: {formatTime(record.endTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">အိပ်ချိန် မရှိပါ</p>
          )}
        </div>

        {/* Activity & Exercise */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">လှုပ်ရှားမှုနှင့် လေ့ကျင့်ခန်း</h2>
          </div>

          {report.activities?.length > 0 ? (
            <div className="space-y-2">
              {report.activities.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <span className="text-sm">
                    {activity.type === 'exercise' ? 'လေ့ကျင့်ခန်း' :
                     activity.type === 'flash_cards' ? 'Flash Card' : 'ပုံပြင်ဖတ်ခြင်း'}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(activity.time)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">လှုပ်ရှားမှု မရှိပါ</p>
          )}
        </div>

        {/* Analysis & Unusual Findings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">သုံးသပ်ချက်နှင့် ထူးခြားဖြစ်စဉ်များ</h2>
          </div>

          {report.abnormalities ? (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-sm text-red-700 whitespace-pre-wrap">{report.abnormalities}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ထူးခြားဖြစ်စဉ် မရှိပါ</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NAReportDetail;
