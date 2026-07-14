import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getNAReportById, updateNAReport } from '../../api';
import { 
  ArrowLeft, Save, Send, Plus, Trash2, Loader2, 
  Baby, Droplets, Moon, Activity, AlertCircle
} from 'lucide-react';

interface FeedingRecord {
  type: 'breast_milk' | 'formula';
  time: string;
  amount: string;
  burpingDone: boolean;
  airReleased: boolean;
  spitUp: boolean;
}

interface SleepRecord {
  type: 'day' | 'night';
  startTime: string;
  endTime: string;
  onSchedule: boolean;
}

interface Activity {
  type: 'exercise' | 'flash_cards' | 'story_reading';
  time: string;
}

const NAReportForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [supplementaryFood, setSupplementaryFood] = useState('');
  const [hygiene, setHygiene] = useState({
    bathTime: '',
    bathType: '' as 'bath' | 'sponge_bath' | '',
    diaperChanges: 0,
    rashCheck: false,
  });
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [abnormalities, setAbnormalities] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['naReport', id],
    queryFn: () => getNAReportById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (report) {
      setFeedingRecords(report.feedingRecords || []);
      setSupplementaryFood(report.supplementaryFood || '');
      setHygiene({
        bathTime: report.hygiene?.bathTime ? new Date(report.hygiene.bathTime).toISOString().slice(11, 16) : '',
        bathType: report.hygiene?.bathType || '',
        diaperChanges: report.hygiene?.diaperChanges || 0,
        rashCheck: report.hygiene?.rashCheck || false,
      });
      setSleepRecords(report.sleepRecords || []);
      setActivities(report.activities || []);
      setAbnormalities(report.abnormalities || '');
    }
  }, [report]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateNAReport(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['naReport', id] });
      queryClient.invalidateQueries({ queryKey: ['naReports'] });
      navigate('/na');
    },
  });

  const addFeedingRecord = () => {
    setFeedingRecords([...feedingRecords, {
      type: 'breast_milk',
      time: new Date().toISOString().slice(11, 16),
      amount: '60ml',
      burpingDone: false,
      airReleased: false,
      spitUp: false,
    }]);
  };

  const removeFeedingRecord = (index: number) => {
    setFeedingRecords(feedingRecords.filter((_, i) => i !== index));
  };

  const updateFeedingRecord = (index: number, field: keyof FeedingRecord, value: any) => {
    const updated = [...feedingRecords];
    updated[index] = { ...updated[index], [field]: value };
    setFeedingRecords(updated);
  };

  const addSleepRecord = () => {
    setSleepRecords([...sleepRecords, {
      type: 'day',
      startTime: new Date().toISOString().slice(11, 16),
      endTime: '',
      onSchedule: true,
    }]);
  };

  const removeSleepRecord = (index: number) => {
    setSleepRecords(sleepRecords.filter((_, i) => i !== index));
  };

  const updateSleepRecord = (index: number, field: keyof SleepRecord, value: any) => {
    const updated = [...sleepRecords];
    updated[index] = { ...updated[index], [field]: value };
    setSleepRecords(updated);
  };

  const addActivity = () => {
    setActivities([...activities, {
      type: 'exercise',
      time: new Date().toISOString().slice(11, 16),
    }]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const handleSave = (status: 'draft' | 'submitted') => {
    const reportData = {
      bookingId: report?.booking?._id || report?.booking,
      date: report?.date,
      childName: report?.childName,
      feedingRecords: feedingRecords.map(r => ({
        ...r,
        time: r.time ? new Date(`2000-01-01T${r.time}`) : new Date(),
      })),
      supplementaryFood,
      hygiene: {
        bathTime: hygiene.bathTime ? new Date(`2000-01-01T${hygiene.bathTime}`) : undefined,
        bathType: hygiene.bathType || undefined,
        diaperChanges: hygiene.diaperChanges,
        rashCheck: hygiene.rashCheck,
      },
      sleepRecords: sleepRecords.map(r => ({
        ...r,
        startTime: r.startTime ? new Date(`2000-01-01T${r.startTime}`) : undefined,
        endTime: r.endTime ? new Date(`2000-01-01T${r.endTime}`) : undefined,
      })),
      activities: activities.map(a => ({
        ...a,
        time: a.time ? new Date(`2000-01-01T${a.time}`) : undefined,
      })),
      abnormalities,
      status,
    };
    updateMutation.mutate(reportData);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/na')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">နေ့စဉ် Report</h1>
            <p className="text-xs text-gray-500">{report.childName} - {new Date(report.date).toLocaleDateString('my-MM')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Nutrition & Feeding */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">အာဟာရနှင့် အစာကျွေးခြင်း</h2>
          </div>

          <div className="space-y-4">
            {feedingRecords.map((record, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">အစာကျွေးချိန် {index + 1}</span>
                  <button
                    onClick={() => removeFeedingRecord(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အမျိုးအစား</label>
                    <select
                      value={record.type}
                      onChange={(e) => updateFeedingRecord(index, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="breast_milk">မိခင်နို့</option>
                      <option value="formula">ဖော်စပ်နို့</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ပမာဏ</label>
                    <select
                      value={record.amount}
                      onChange={(e) => updateFeedingRecord(index, 'amount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="30ml">30 ml</option>
                      <option value="60ml">60 ml</option>
                      <option value="90ml">90 ml</option>
                      <option value="120ml">120 ml</option>
                      <option value="150ml">150 ml</option>
                      <option value="180ml">180 ml</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အချိန်</label>
                    <input
                      type="time"
                      value={record.time}
                      onChange={(e) => updateFeedingRecord(index, 'time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={record.burpingDone}
                      onChange={(e) => updateFeedingRecord(index, 'burpingDone', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    နို့တိုက်ပြီး
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={record.airReleased}
                      onChange={(e) => updateFeedingRecord(index, 'airReleased', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    လေထုတ်ပေးပြီး
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={record.spitUp}
                      onChange={(e) => updateFeedingRecord(index, 'spitUp', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    နို့အန်
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={addFeedingRecord}
              className="w-full py-2 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              အစာကျွေးချိန် ထည့်ရန်
            </button>

            <div>
              <label className="block text-xs text-gray-500 mb-1">ဖြည့်စွက်စာ (၆လအထက်)</label>
              <input
                type="text"
                value={supplementaryFood}
                onChange={(e) => setSupplementaryFood(e.target.value)}
                placeholder="ဖြည့်စွက်စာ အကြောင်းရေးပါ"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Personal Hygiene */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">တစ်ကိုယ်ရည် သန့်ရှင်းရေး</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ရေချိုးချိန်</label>
                <input
                  type="time"
                  value={hygiene.bathTime}
                  onChange={(e) => setHygiene({ ...hygiene, bathTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ရေချိုးနည်း</label>
                <select
                  value={hygiene.bathType}
                  onChange={(e) => setHygiene({ ...hygiene, bathType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="">ရွေးချယ်ပါ</option>
                  <option value="bath">ရေချိုးခြင်း</option>
                  <option value="sponge_bath">ရေပတ်တိုက်ခြင်း</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Diaper လဲလှယ်ချိန် (အကိမ်ရေ)</label>
              <input
                type="number"
                min="0"
                value={hygiene.diaperChanges}
                onChange={(e) => setHygiene({ ...hygiene, diaperChanges: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hygiene.rashCheck}
                onChange={(e) => setHygiene({ ...hygiene, rashCheck: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              ဆီးပူ/ဝမ်းပူမိခြင်း ရှိ
            </label>
          </div>
        </div>

        {/* Sleeping */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">အိပ်ချိန်</h2>
          </div>

          <div className="space-y-4">
            {sleepRecords.map((record, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">အိပ်ချိန် {index + 1}</span>
                  <button
                    onClick={() => removeSleepRecord(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အမျိုးအစား</label>
                    <select
                      value={record.type}
                      onChange={(e) => updateSleepRecord(index, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="day">နေ့ဘက်</option>
                      <option value="night">ညဘက်</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အချိန်သတ်မှတ်ချက်</label>
                    <select
                      value={record.onSchedule.toString()}
                      onChange={(e) => updateSleepRecord(index, 'onSchedule', e.target.value === 'true')}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="true">အချိန်မှန်</option>
                      <option value="false">အချိန်မမှန်</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အိပ်ချိန်</label>
                    <input
                      type="time"
                      value={record.startTime}
                      onChange={(e) => updateSleepRecord(index, 'startTime', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">နိုးချိန်</label>
                    <input
                      type="time"
                      value={record.endTime}
                      onChange={(e) => updateSleepRecord(index, 'endTime', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSleepRecord}
              className="w-full py-2 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              အိပ်ချိန် ထည့်ရန်
            </button>
          </div>
        </div>

        {/* Activity & Exercise */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">လှုပ်ရှားမှုနှင့် လေ့ကျင့်ခန်း</h2>
          </div>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အမျိုးအစား</label>
                    <select
                      value={activity.type}
                      onChange={(e) => updateActivity(index, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="exercise">လေ့ကျင့်ခန်း</option>
                      <option value="flash_cards">Flash Card</option>
                      <option value="story_reading">ပုံပြင်ဖတ်ခြင်း</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">အချိန်</label>
                    <input
                      type="time"
                      value={activity.time}
                      onChange={(e) => updateActivity(index, 'time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeActivity(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={addActivity}
              className="w-full py-2 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              လှုပ်ရှားမှု ထည့်ရန်
            </button>
          </div>
        </div>

        {/* Analysis & Unusual Findings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-primary h-5 w-5" />
            <h2 className="font-bold text-gray-900">သုံးသပ်ချက်နှင့် ထူးခြားဖြစ်စဉ်များ</h2>
          </div>

          <textarea
            value={abnormalities}
            onChange={(e) => setAbnormalities(e.target.value)}
            placeholder="ကလေးတွင် ပုံမှန်မဟုတ်သည့် ထူးခြားဖြစ်စဉ်များ (ဖျားနာခြင်း၊ အနီစက်ထွက်ခြင်း၊ မှုတ်နေခြင်း) ရှိပါက ရေးသားပါ"
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={updateMutation.isPending}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            မှတ်ထားရန်
          </button>
          <button
            onClick={() => handleSave('submitted')}
            disabled={updateMutation.isPending}
            className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
            ပေးပို့ရန်
          </button>
        </div>
      </div>
    </div>
  );
};

export default NAReportForm;
