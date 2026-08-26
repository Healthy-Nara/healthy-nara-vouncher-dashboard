import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDutyLogs } from '../api';
import { Clock, Calendar, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

export const DutyLogs = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ['adminDutyLogs', selectedDate],
    queryFn: () => getAdminDutyLogs({ date: selectedDate }),
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hr ${minutes} min`;
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="ATTENDANCE & TIME"
          title="Caregiver Duty Logs"
          subtitle="Real-time shift check-in, check-out timestamps, and working hours."
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="shrink-0">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Date:</span>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duty Logs Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>Shift Time Logs</CardTitle>
            <CardDescription>
              {logs.length} check-in sessions recorded
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading duty logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No duty logs found for this date</p>
              <p className="text-xs text-slate-400">Caregiver check-ins will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CAREGIVER / NA</TableHead>
                      <TableHead>BOOKING #</TableHead>
                      <TableHead>START TIME</TableHead>
                      <TableHead>END TIME</TableHead>
                      <TableHead>DURATION</TableHead>
                      <TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => {
                      const caregiverName =
                        log.caregiver?.caregiverName || log.caregiverName || 'Caregiver';
                      const isOnDuty = !log.dutyEnd;

                      return (
                        <TableRow key={log._id}>
                          {/* Caregiver Name with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={caregiverName} size="xs" />
                              <span className="font-bold text-slate-900 text-xs">
                                {caregiverName}
                              </span>
                            </div>
                          </TableCell>

                          {/* Booking # */}
                          <TableCell>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {log.booking?.bookingNumber || '—'}
                            </span>
                          </TableCell>

                          {/* Start Time */}
                          <TableCell>
                            <span className="text-xs font-semibold text-slate-800">
                              {formatTime(log.dutyStart)}
                            </span>
                          </TableCell>

                          {/* End Time */}
                          <TableCell>
                            <span className="text-xs text-slate-600">
                              {formatTime(log.dutyEnd)}
                            </span>
                          </TableCell>

                          {/* Duration */}
                          <TableCell>
                            <span className="text-xs font-bold font-mono text-teal-700">
                              {calculateDuration(log.dutyStart, log.dutyEnd)}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant={isOnDuty ? 'onDuty' : 'completed'} dot>
                              {isOnDuty ? 'On Duty' : 'Completed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {logs.map((log: any) => {
                  const caregiverName =
                    log.caregiver?.caregiverName || log.caregiverName || 'Caregiver';
                  const isOnDuty = !log.dutyEnd;

                  return (
                    <div
                      key={log._id}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={caregiverName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {caregiverName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {log.booking?.bookingNumber || 'No Booking #'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isOnDuty ? 'onDuty' : 'completed'} dot>
                          {isOnDuty ? 'On Duty' : 'Completed'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Shift Period</p>
                          <p className="font-semibold text-slate-800 text-xs mt-0.5">
                            {formatTime(log.dutyStart)} — {formatTime(log.dutyEnd)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Duration</p>
                          <p className="font-black text-teal-700 font-mono text-xs mt-0.5">
                            {calculateDuration(log.dutyStart, log.dutyEnd)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${logs.length} duty logs`}
            updatedText="Real-time attendance"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DutyLogs;
