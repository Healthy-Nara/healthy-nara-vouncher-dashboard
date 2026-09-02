import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDutyLogs } from '../api';
import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Loader2, X } from 'lucide-react';
import { DateRange, type Range, type RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [tempDateRange, setTempDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDatePicker = () => {
    if (startDate && endDate) {
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      const current = [
        {
          startDate: new Date(sYear, sMonth - 1, sDay),
          endDate: new Date(eYear, eMonth - 1, eDay),
          key: 'selection',
        },
      ];
      setTempDateRange(current);
    } else {
      setTempDateRange(dateRange);
    }
    setShowDatePicker(true);
  };

  const handleDateRangeChange = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    setTempDateRange([selection]);
  };

  const applyPreset = (preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => {
    const today = new Date();
    if (preset === 'all') {
      const resetRange = [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
      setDateRange(resetRange);
      setTempDateRange(resetRange);
      setStartDate('');
      setEndDate('');
      setShowDatePicker(false);
      return;
    }

    let start = new Date(today);
    let end = new Date(today);

    if (preset === 'today') {
      start = today;
      end = today;
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = y;
      end = y;
    } else if (preset === 'thisWeek') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.getFullYear(), today.getMonth(), diff);
      end = new Date();
    } else if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date();
    }

    setTempDateRange([{ startDate: start, endDate: end, key: 'selection' }]);
  };

  const handleApplyDateRange = () => {
    const sel = tempDateRange[0];
    if (sel?.startDate && sel?.endDate) {
      setDateRange(tempDateRange);
      setStartDate(format(sel.startDate as Date, 'yyyy-MM-dd'));
      setEndDate(format(sel.endDate as Date, 'yyyy-MM-dd'));
    }
    setShowDatePicker(false);
  };

  const handleClearDateFilter = () => {
    const defaultRange = [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
    setDateRange(defaultRange);
    setTempDateRange(defaultRange);
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ['adminDutyLogs', startDate, endDate],
    queryFn: () =>
      getAdminDutyLogs({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 shrink-0 relative z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Date Range Picker Button */}
          <div className="flex items-center gap-1">
            <Button
              variant={startDate ? 'primary' : 'outline'}
              size="sm"
              onClick={openDatePicker}
              leftIcon={<CalendarIcon size={14} />}
              className="cursor-pointer"
            >
              {startDate
                ? `${startDate} — ${endDate || startDate}`
                : 'Date Range'}
            </Button>
            {startDate && (
              <button
                type="button"
                onClick={handleClearDateFilter}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Clear date range filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Duty Logs Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>CAREGIVER / NA</TableHead>
                      <TableHead>BOOKING #</TableHead>
                      <TableHead>START TIME</TableHead>
                      <TableHead>END TIME</TableHead>
                      <TableHead>DURATION</TableHead>
                      <TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any, index: number) => {
                      const caregiverName =
                        log.caregiver?.caregiverName || log.caregiverName || 'Caregiver';
                      const isOnDuty = !log.dutyEnd;

                      return (
                        <TableRow key={log._id}>
                          {/* Row Number */}
                          <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold w-12">
                            {index + 1}
                          </TableCell>
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

      {/* DATE RANGE MODAL */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            ref={datePickerRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-fadeIn max-h-[95vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Select Date Range</h4>
                  <p className="text-xs text-slate-400">Filter duty logs by date range</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick Presets</p>
              <div className="flex flex-wrap gap-1.5">
                <Button size="xs" variant="outline" onClick={() => applyPreset('today')}>
                  Today
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('yesterday')}>
                  Yesterday
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('thisWeek')}>
                  This Week
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('thisMonth')}>
                  This Month
                </Button>
                <Button size="xs" variant="outline" onClick={() => applyPreset('all')}>
                  All Time
                </Button>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="overflow-x-auto flex justify-center bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
              <DateRange
                ranges={tempDateRange}
                onChange={handleDateRangeChange}
                rangeColors={['#14B8A6']}
                editableDateInputs={true}
                moveRangeOnFirstSelection={false}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600">
                {tempDateRange[0]?.startDate && tempDateRange[0]?.endDate
                  ? `${format(tempDateRange[0].startDate, 'yyyy-MM-dd')} to ${format(tempDateRange[0].endDate, 'yyyy-MM-dd')}`
                  : 'No date selected'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDateFilter}
                >
                  Clear Filter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyDateRange}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyLogs;
