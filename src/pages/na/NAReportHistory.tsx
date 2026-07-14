import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getNAReports } from '../../api';
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, 
  ChevronRight, Calendar, Loader2
} from 'lucide-react';

const NAReportHistory = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['naReports', selectedDate],
    queryFn: () => getNAReports({ date: selectedDate }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('my-MM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <h1 className="font-bold text-gray-900">Report မှတ်တမ်း</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
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

        {/* Reports List */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <h2 className="font-bold text-gray-900 mb-4">
            {formatDate(selectedDate)} Report များ
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>ဤရက်စွဲအတွက် Report မရှိပါ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any) => (
                <button
                  key={report._id}
                  onClick={() => navigate(`/na/report/${report._id}/view`)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      report.status === 'submitted' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {report.status === 'submitted' ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{report.childName}</p>
                      <p className="text-xs text-gray-500">
                        {report.status === 'submitted' ? 'ပြီးဆုံးပြီ' : 'ဖြည့်ဆဲ'}
                        {report.submittedAt && (
                          <> - {new Date(report.submittedAt).toLocaleTimeString('my-MM')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Date Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10">
          <p className="text-sm font-medium text-gray-700 mb-3">အမြန်ရွေးချယ်ရန်</p>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6].map((daysAgo) => {
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              const dateStr = date.toISOString().split('T')[0];
              return (
                <button
                  key={daysAgo}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDate === dateStr
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {daysAgo === 0 ? 'ယနေ့' : 
                   daysAgo === 1 ? 'မနေ့' : 
                   `${daysAgo} ရက်လွန်`}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NAReportHistory;
