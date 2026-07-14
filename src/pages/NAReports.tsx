import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminNAReports } from '../api';
import { 
  FileText, CheckCircle2, Clock, Calendar, User, 
  ChevronRight, Loader2, Filter
} from 'lucide-react';

const NAReports = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['adminNAReports', selectedDate, statusFilter],
    queryFn: () => getAdminNAReports({ 
      date: selectedDate, 
      status: statusFilter || undefined 
    }),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">NA Report များ</h1>
          <p className="text-sm text-gray-500 mt-1">Nurse Aid များ၏ နေ့စဉ် Report များ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="">အားလုံး</option>
              <option value="draft">ဖြည့်ဆဲ</option>
              <option value="submitted">ပေးပို့ပြီး</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Report မရှိပါ</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">NA</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">ကလေး</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">ရက်စွဲ</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">အခြေအနေ</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">ပေးပို့ချိန်</th>
                    <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report: any) => (
                    <tr 
                      key={report._id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/na-reports/${report._id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                            <User className="text-primary h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {report.caregiver?.caregiverName || report.caregiverName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{report.childName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(report.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'submitted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {report.status === 'submitted' ? 'ပေးပို့ပြီး' : 'ဖြည့်ဆဲ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTime(report.submittedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="text-gray-400 h-5 w-5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {reports.map((report: any) => (
                <div
                  key={report._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/na-reports/${report._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                        <User className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {report.caregiver?.caregiverName || report.caregiverName}
                        </p>
                        <p className="text-xs text-gray-500">{report.childName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'submitted' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status === 'submitted' ? 'ပေးပို့ပြီး' : 'ဖြည့်ဆဲ'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(report.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NAReports;
