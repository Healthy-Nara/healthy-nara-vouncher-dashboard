import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBookings, fetchParents, createBookingFromParent } from '../api';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, ChevronRight, Calendar, Package, User, Plus, X } from 'lucide-react';
import CustomDatePicker, { parseDdMmYyyy } from '../components/CustomDatePicker';

const ALL_STATUSES = ['All', 'Pending NA Selection', 'Assigned', 'Completed', 'Cancelled'] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Pending NA Selection': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  'Assigned':            { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Completed':           { color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  'Cancelled':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const Bookings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentForm, setParentForm] = useState({ servicePackage: '', dutyDuration: '', dutyShift: '', requestedDates: [] as string[], additionalNotes: '' });
  const [newDate, setNewDate] = useState('');

  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetchBookings(),
  });

  const { data: allParents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => fetchParents(),
  });

  const queryClient = useQueryClient();
  const createFromParentMutation = useMutation({
    mutationFn: (data: any) => {
      const toIso = (d: string) => d ? new Date(d.split('-').reverse().join('-')).toISOString() : d;
      const payload = {
        ...data,
        requestedDates: data.requestedDates?.map((d: string) => toIso(d)),
      };
      return createBookingFromParent(payload);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowParentModal(false);
      setSelectedParentId('');
      setParentForm({ servicePackage: '', dutyDuration: '', dutyShift: '', requestedDates: [], additionalNotes: '' });
      setParentSearch('');
      setNewDate('');
      navigate(`/bookings/${result._id}`);
    },
  });

  const filteredBookings = useMemo(() => {
    let result = allBookings;
    if (statusFilter !== 'All') {
      result = result.filter((b: any) => b.status === statusFilter);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((b: any) =>
        b.bookingNumber?.toLowerCase().includes(s) ||
        b.customerName?.toLowerCase().includes(s) ||
        b.phoneNumber?.includes(s) ||
        b.parent?.parentName?.toLowerCase().includes(s) ||
        b.parent?.contactNumber?.includes(s)
      );
    }
    return result;
  }, [allBookings, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allBookings.length };
    ALL_STATUSES.forEach(s => { if (s !== 'All') counts[s] = 0; });
    allBookings.forEach((b: any) => { counts[b.status || 'Pending NA Selection']++; });
    return counts;
  }, [allBookings]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
      return format(parseDdMmYyyy(dateStr), 'dd-MM');
    }
    return format(new Date(dateStr), 'dd-MM');
  };

  const formatDateRange = (dates: string[]) => {
    if (!dates || dates.length === 0) return 'No dates';
    if (dates.length === 1) return formatDate(dates[0]);
    return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{allBookings.length} total bookings</p>
        </div>
        <button
          onClick={() => setShowParentModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all"
        >
          <Plus size={16} />
          Create from Parent
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking #, customer name, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
          />
        </div>
        {/* Status Filter Pills - Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden scrollbar-hide">
          {ALL_STATUSES.map(status => {
            const config = STATUS_CONFIG[status];
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? status === 'All'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${config?.bg || 'bg-gray-100'} ${config?.color || 'text-gray-700'} border-current`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {config?.icon && <span className="mr-1">{config.icon}</span>}
                {status === 'Pending NA Selection' ? 'Pending' : status}
                <span className="ml-1 opacity-60">{statusCounts[status] || 0}</span>
              </button>
            );
          })}
        </div>
        {/* Status Filter Dropdown - Desktop */}
        <div className="hidden md:block">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s} ({statusCounts[s] || 0})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No bookings found</p>
          <p className="text-xs mt-1">Bookings are created when a Lead is converted</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {filteredBookings.map((booking: any) => {
              const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG['Pending NA Selection'];
              return (
                <div
                  key={booking._id}
                  onClick={() => navigate(`/bookings/${booking._id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-gray-500">{booking.bookingNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                          {config.icon} {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{booking.parent?.parentName || booking.customerName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.parent?.contactNumber || booking.phoneNumber}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                      <Package size={10} />
                      {booking.servicePackage || 'N/A'}
                    </span>
                    <span className="text-[10px] text-gray-600">{booking.dutyType}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                      <Calendar size={10} />
                      {formatDateRange(booking.requestedDates)}
                    </span>
                  </div>

                  {booking.caregiverName && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                      <User size={10} className="text-primary" />
                      <span className="text-[10px] text-primary font-medium">NA: {booking.caregiverName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Booking #</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">NA</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking: any) => {
                    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG['Pending NA Selection'];
                    return (
                      <tr
                        key={booking._id}
                        onClick={() => navigate(`/bookings/${booking._id}`)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 text-xs">{booking.bookingNumber}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">{getTimeAgo(booking.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">{booking.parent?.parentName || booking.customerName}</span>
                          <p className="text-xs text-gray-500">{booking.parent?.contactNumber || booking.phoneNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">{booking.servicePackage || 'N/A'}</span>
                          <p className="text-[10px] text-gray-400">{booking.dutyType}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {formatDateRange(booking.requestedDates)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                            {config.icon} {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {booking.caregiverName ? (
                            <span className="text-xs text-primary font-medium">{booking.caregiverName}</span>
                          ) : (
                            <span className="text-xs text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${booking._id}`); }}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create from Parent Modal */}
      {showParentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Create Booking from Parent</h2>
              <button onClick={() => { setShowParentModal(false); setSelectedParentId(''); setParentSearch(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Step 1: Select Parent */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Select Parent</label>
                {selectedParentId ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-primary/10 border border-primary/30 rounded-lg">
                    <span className="text-sm font-bold text-primary">{allParents.find((p: any) => p._id === selectedParentId)?.parentName} <span className="font-normal text-primary/70 ml-2">{allParents.find((p: any) => p._id === selectedParentId)?.contactNumber}</span></span>
                    <button onClick={() => setSelectedParentId('')} className="text-xs text-gray-500 hover:text-gray-700 font-bold">Change</button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search parents..."
                        value={parentSearch}
                        onChange={e => setParentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {allParents
                        .filter((p: any) => !parentSearch || p.parentName?.toLowerCase().includes(parentSearch.toLowerCase()) || p.contactNumber?.includes(parentSearch))
                        .map((parent: any) => (
                          <button
                            key={parent._id}
                            onClick={() => setSelectedParentId(parent._id)}
                            className="w-full text-left px-3 py-2.5 text-sm transition-all hover:bg-gray-50 text-gray-700"
                          >
                            <span>{parent.parentName}</span>
                            {parent.contactNumber && <span className="text-xs text-gray-400 ml-2">{parent.contactNumber}</span>}
                          </button>
                        ))}
                      {allParents.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">No parents found</p>}
                    </div>
                  </>
                )}
              </div>

              {/* Step 2: Booking Details */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Booking Details</label>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Service Type</label>
                  <select
                    value={parentForm.servicePackage}
                    onChange={e => setParentForm(f => ({ ...f, servicePackage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select service type</option>
                    <option value="Newborn Service">Newborn Service</option>
                    <option value="Childcare Service">Childcare Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Duty Duration</label>
                  <select
                    value={parentForm.dutyDuration}
                    onChange={e => setParentForm(f => ({ ...f, dutyDuration: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select duration</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Duty Shift</label>
                  <select
                    value={parentForm.dutyShift}
                    onChange={e => setParentForm(f => ({ ...f, dutyShift: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select shift</option>
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Requested Dates</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <CustomDatePicker
                        selected={newDate ? parseDdMmYyyy(newDate) : new Date()}
                        onChange={(date) => setNewDate(format(date, 'dd-MM-yyyy'))}
                        minDate={new Date()}
                      />
                    </div>
                    <button onClick={() => {
                      if (newDate && !parentForm.requestedDates.includes(newDate)) {
                        setParentForm(f => ({ ...f, requestedDates: [...f.requestedDates, newDate] }));
                        setNewDate('');
                      }
                    }} disabled={!newDate}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all">
                      Add
                    </button>
                  </div>
                  {parentForm.requestedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parentForm.requestedDates.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                          {formatDate(d)}
                          <button onClick={() => setParentForm(f => ({ ...f, requestedDates: f.requestedDates.filter((_, j) => j !== i) }))}
                            className="p-0.5 hover:bg-primary/20 rounded-full">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No dates added yet</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Additional Notes</label>
                  <textarea
                    value={parentForm.additionalNotes}
                    onChange={e => setParentForm(f => ({ ...f, additionalNotes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => { setShowParentModal(false); setSelectedParentId(''); setParentSearch(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedParentId) return;
                  createFromParentMutation.mutate({
                    parentInfo: selectedParentId,
                    ...parentForm,
                  });
                }}
                disabled={!selectedParentId || createFromParentMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {createFromParentMutation.isPending ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
