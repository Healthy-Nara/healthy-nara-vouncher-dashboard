import { useQuery } from '@tanstack/react-query';
import { fetchLogs } from '../api';
import { Clock, Calendar, Shield, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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

export const Logs = () => {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ['logs'],
    queryFn: () => fetchLogs(),
  });

  const getActionBadge = (action: string) => {
    if (action.includes('Create')) return <Badge variant="emerald" dot>{action}</Badge>;
    if (action.includes('Delete')) return <Badge variant="rose" dot>{action}</Badge>;
    if (action.includes('Update')) return <Badge variant="sky" dot>{action}</Badge>;
    if (action.includes('Login')) return <Badge variant="purple" dot>{action}</Badge>;
    return <Badge variant="slate" dot>{action}</Badge>;
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="SECURITY & AUDIT"
          title="Activity History Logs"
          subtitle="View detailed audit trail of all system actions performed by administrators and staff."
        />
      </div>

      {/* Logs Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>System Audit Trail</CardTitle>
            <CardDescription>
              {logs.length} logged events recorded
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading history logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Shield className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No activity history recorded yet</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATE & TIME</TableHead>
                      <TableHead>ACCOUNT</TableHead>
                      <TableHead>ACTION</TableHead>
                      <TableHead>RESOURCE</TableHead>
                      <TableHead>DETAILS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log._id}>
                        {/* Date & Time */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-900 font-semibold">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{new Date(log.timestamp).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>

                        {/* Account */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={log.username || 'Admin'} size="xs" />
                            <span className="text-xs font-bold text-slate-800">
                              {log.username}
                            </span>
                          </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell>{getActionBadge(log.action || 'System')}</TableCell>

                        {/* Resource */}
                        <TableCell>
                          <div className="text-xs font-bold text-slate-800">
                            {log.resourceType || 'System'}
                          </div>
                          <div className="text-[11px] font-mono text-teal-600 font-bold">
                            {log.resourceId || '—'}
                          </div>
                        </TableCell>

                        {/* Details */}
                        <TableCell>
                          <p className="text-xs text-slate-600 max-w-md truncate" title={log.details}>
                            {log.details || '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {logs.map((log: any) => (
                  <div
                    key={log._id}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.username || 'Admin'} size="xs" />
                        <span className="font-bold text-slate-900 text-xs">{log.username}</span>
                      </div>
                      {getActionBadge(log.action || 'System')}
                    </div>

                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{log.resourceType || 'System'}</span>
                        <span className="font-mono text-teal-600">{log.resourceId || '—'}</span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-slate-500">{log.details}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100/80">
                      <span>{new Date(log.timestamp).toLocaleDateString('en-GB')}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${logs.length} audit records`}
            updatedText="Auto-recorded real-time"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
