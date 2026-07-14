import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getFamilyReports, getFamilyReportByDate } from '../api';
import { 
  Heart, FileText, CheckCircle2, Clock, Calendar, 
  User, Droplets, Baby, Moon, Activity, AlertCircle,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const FamilyReports = () => {
  const { token } = useParams<{ token: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['familyReports', token],
    queryFn: () => getFamilyReports(token!),
    enabled: !!token,
  });

  const { data: singleReport, isLoading: singleLoading } = useQuery({
    queryKey: ['familyReport', token, selectedDate],
    queryFn: () => getFamilyReportByDate(token!, selectedDate),
    enabled: !!token && !!selectedDate,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('my-MM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('my-MM', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto mb-3 text-primary" />
          <p className="text-gray-500">ဒီ link သည် မမှန်ကန်ပါ</p>
        </div>
      </div>
    );
  }

  const { reports, booking } = reportsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-primary/10">
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Healthy Nara</h1>
          <p className="text-gray-500 mt-1">ကလေး၏ နေ့စဉ် Report များ</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Booking Info */}
        {booking && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                <User className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.customerName}</p>
                <p className="text-xs text-gray-500">Booking: {booking.bookingNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary h-5 w-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
        </div>

        {/* Single Report View */}
        {singleLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : singleReport ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{singleReport.childName}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                singleReport.status === 'submitted' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {singleReport.status === 'submitted' ? 'ပြီးဆုံးပြီ' : 'ဖြည့်ဆဲ'}
              </span>
            </div>

            {/* Feeding */}
            {singleReport.feedingRecords?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">အစာကျွေးခြင်း</span>
                </div>
                <div className="space-y-2">
                  {singleReport.feedingRecords.map((record: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2 text-sm">
                      <span className="font-medium">
                        {record.type === 'breast_milk' ? 'မိခင်နို့' : 'ဖော်စပ်နို့'}
                      </span>
                      <span className="text-gray-500 ml-2">{record.amount}</span>
                      <span className="text-gray-400 ml-2">{formatTime(record.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hygiene */}
            {singleReport.hygiene && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">သန့်ရှင်းရေး</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-sm grid grid-cols-2 gap-2">
                  <div>Diaper: {singleReport.hygiene.diaperChanges || 0} အကိမ်</div>
                  <div>ဆီးပူ: {singleReport.hygiene.rashCheck ? 'ရှိ' : 'မရှိ'}</div>
                </div>
              </div>
            )}

            {/* Sleep */}
            {singleReport.sleepRecords?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">အိပ်ချိန်</span>
                </div>
                <div className="space-y-2">
                  {singleReport.sleepRecords.map((record: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2 text-sm">
                      <span className="font-medium">
                        {record.type === 'day' ? 'နေ့ဘက်' : 'ညဘက်'}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {formatTime(record.startTime)} - {formatTime(record.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {singleReport.activities?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">လှုပ်ရှားမှု</span>
                </div>
                <div className="space-y-1">
                  {singleReport.activities.map((activity: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2 text-sm">
                      {activity.type === 'exercise' ? 'လေ့ကျင့်ခန်း' :
                       activity.type === 'flash_cards' ? 'Flash Card' : 'ပုံပြင်ဖတ်ခြင်း'}
                      <span className="text-gray-400 ml-2">{formatTime(activity.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abnormalities */}
            {singleReport.abnormalities && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="text-red-500 h-4 w-4" />
                  <span className="text-sm font-medium text-red-700">ထူးခြားဖြစ်စဉ်</span>
                </div>
                <p className="text-sm text-red-600">{singleReport.abnormalities}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>ဤရက်စွဲအတွက် Report မရှိပါ</p>
          </div>
        )}

        {/* All Reports List */}
        {reports && reports.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
            <h2 className="font-bold text-gray-900 mb-4">Report များအားလုံး</h2>
            <div className="space-y-3">
              {reports.map((report: any) => (
                <button
                  key={report._id}
                  onClick={() => setSelectedDate(new Date(report.date).toISOString().split('T')[0])}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      report.status === 'submitted' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {report.status === 'submitted' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{report.childName}</p>
                      <p className="text-xs text-gray-500">{formatDate(report.date)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>&copy; 2026 Healthy Nara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default FamilyReports;
