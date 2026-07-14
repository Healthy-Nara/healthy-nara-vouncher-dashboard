import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDutyLogs } from '../api';
import { Clock, Calendar, User, Loader2, Timer } from 'lucide-react';

const DutyLogs = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['adminDutyLogs', selectedDate],
    queryFn: () => getAdminDutyLogs({ date: selectedDate }),
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('my-MM', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} နာရီ ${minutes} မိနစ်`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Duty Log များ</h1>
          <p className="text-sm text-gray-500 mt-1">Nurse Aid များ၏ အလုပ်ချိန် မှတ်တမ်း</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Duty Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Duty Log မရှိပါ</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">NA</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Booking</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">စတင်ချိန်</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">ပြီးဆုံးချိန်</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">ကြာချိန်</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">အခြေအနေ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                            <User className="text-primary h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {log.caregiver?.caregiverName || log.caregiverName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.booking?.bookingNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatTime(log.dutyStart)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.dutyEnd ? formatTime(log.dutyEnd) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Timer size={14} className="text-gray-400" />
                          {calculateDuration(log.dutyStart, log.dutyEnd)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.status === 'completed' ? 'ပြီးဆုံးပြီ' : 'လုပ်နေဆဲ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((log: any) => (
                <div key={log._id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                        <User className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {log.caregiver?.caregiverName || log.caregiverName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.booking?.bookingNumber || 'Booking'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {log.status === 'completed' ? 'ပြီးဆုံးပြီ' : 'လုပ်နေဆဲ'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">စတင်ချိန်</p>
                      <p className="font-medium">{formatTime(log.dutyStart)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ပြီးဆုံးချိန်</p>
                      <p className="font-medium">{log.dutyEnd ? formatTime(log.dutyEnd) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ကြာချိန်</p>
                      <p className="font-medium">{calculateDuration(log.dutyStart, log.dutyEnd)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      {logs && logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">
              {logs.filter((l: any) => l.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500">လုပ်နေဆဲ</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10 text-center">
            <p className="text-2xl font-bold text-green-600">
              {logs.filter((l: any) => l.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-500">ပြီးဆုံးပြီ</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary/10 text-center">
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            <p className="text-xs text-gray-500">စုစုပေါင်း</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyLogs;
