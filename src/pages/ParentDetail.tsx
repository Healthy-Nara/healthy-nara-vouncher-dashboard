import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchParentById, fetchParentBookings, updateParent } from '../api';
import { useState } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Baby, Calendar, ChevronRight, Edit2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Pending NA Selection': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  'Assigned':            { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Completed':           { color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  'Cancelled':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const ParentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    parentName: '',
    contactNumber: '',
    township: '',
    address: '',
    religion: '',
    nearestBusStop: '',
    durationOfBusStopToHome: '',
    status: 'Inactive',
    profession: '',
  });

  const { data: parent, isLoading } = useQuery({
    queryKey: ['parent', id],
    queryFn: () => fetchParentById(id!),
    enabled: !!id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['parentBookings', id],
    queryFn: () => fetchParentBookings(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateParent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent', id] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setIsEditing(false);
    },
  });

  const startEdit = () => {
    setEditForm({
      parentName: parent?.parentName || '',
      contactNumber: parent?.contactNumber || '',
      township: parent?.township || '',
      address: parent?.address || '',
      religion: parent?.religion || '',
      nearestBusStop: parent?.nearestBusStop || '',
      durationOfBusStopToHome: parent?.durationOfBusStopToHome || '',
      status: parent?.status || 'Inactive',
      profession: parent?.profession || '',
    });
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  };

  const PARENT_STATUSES = ['Daily', 'Weekly', 'Monthly', 'Custom', 'Inactive'] as const;

  const STATUS_STYLE: Record<string, string> = {
    Daily: 'bg-green-100 text-green-800 border-green-200',
    Weekly: 'bg-blue-100 text-blue-800 border-blue-200',
    Monthly: 'bg-purple-100 text-purple-800 border-purple-200',
    Custom: 'bg-amber-100 text-amber-800 border-amber-200',
    Inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!parent) return <div className="text-center py-12 text-gray-500">Parent not found</div>;

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/parents')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Parents"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{parent.parentName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLE[parent.status || 'Inactive'] || STATUS_STYLE.Inactive}`}>
                {parent.status || 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{parent.contactNumber} • {parent.township || 'Yangon'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0d6d5c] hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Calendar size={14} />
          <span>New Booking</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Parent Info */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Parent Info</h2>
              {!isEditing && (
                <button onClick={startEdit} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                  <Edit2 size={13} />
                </button>
              )}
            </div>
            <div className="p-4 sm:p-5">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Parent Name</label>
                    <input type="text" value={editForm.parentName} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Contact Number</label>
                    <input type="text" value={editForm.contactNumber} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Township</label>
                    <input type="text" value={editForm.township} onChange={e => setEditForm({ ...editForm, township: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Address</label>
                    <textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Religion</label>
                    <select value={editForm.religion} onChange={e => setEditForm({ ...editForm, religion: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-white">
                      <option value="">Select Religion</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nearest Bus Stop</label>
                    <input type="text" value={editForm.nearestBusStop} onChange={e => setEditForm({ ...editForm, nearestBusStop: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Duration (Bus Stop to Home)</label>
                    <input type="text" value={editForm.durationOfBusStopToHome} onChange={e => setEditForm({ ...editForm, durationOfBusStopToHome: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status (ဝန်ဆောင်မှုအခြေအနေ)</label>
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-white">
                      {PARENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Job / Profession (အလုပ်အကိုင်)</label>
                    <input type="text" value={editForm.profession} onChange={e => setEditForm({ ...editForm, profession: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20" placeholder="e.g. Engineer" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)}
                      className="flex-1 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all py-2">
                      Cancel
                    </button>
                    <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.parentName || updateMutation.isPending}
                      className="flex-1 bg-[#0d6d5c] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-all py-2 disabled:opacity-50">
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold">Name</span>
                    <span className="font-bold text-slate-900">{parent.parentName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold">Phone</span>
                    <a href={`tel:${parent.contactNumber}`} className="font-bold text-[#0d6d5c] hover:underline inline-flex items-center gap-1 font-mono">
                      <Phone size={11} /> {parent.contactNumber}
                    </a>
                  </div>
                  {parent.township && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">Township</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {parent.township}</span>
                    </div>
                  )}
                  {parent.address && (
                    <div className="py-1 border-b border-slate-100 space-y-1">
                      <span className="text-slate-400 font-bold block">Address</span>
                      <p className="font-medium text-slate-700 whitespace-pre-wrap">{parent.address}</p>
                    </div>
                  )}
                  {parent.religion && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">Religion</span>
                      <span className="font-bold text-slate-900">{parent.religion}</span>
                    </div>
                  )}
                  {parent.nearestBusStop && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">Nearest Bus Stop</span>
                      <span className="font-bold text-slate-900">{parent.nearestBusStop}</span>
                    </div>
                  )}
                  {parent.durationOfBusStopToHome && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">Duration to Home</span>
                      <span className="font-bold text-slate-900">{parent.durationOfBusStopToHome}</span>
                    </div>
                  )}
                  {parent.profession && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">Job / Profession</span>
                      <span className="font-bold text-slate-900">{parent.profession}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 font-bold">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${STATUS_STYLE[parent.status || 'Inactive'] || STATUS_STYLE.Inactive}`}>
                      {parent.status || 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Children Card */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Baby size={13} /> Children ({parent.children?.length || 0})
              </h2>
            </div>
            <div className="p-4 sm:p-5">
              {parent.children && parent.children.length > 0 ? (
                <div className="space-y-2.5">
                  {parent.children.map((child: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0d6d5c] flex items-center justify-center text-xs font-bold shrink-0">
                        <Baby size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">{child.childName}</p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {child.birthDate && <span>{format(new Date(child.birthDate), 'dd-MM-yyyy')}</span>}
                          {child.gender && <span>• {child.gender}</span>}
                        </div>
                        {child.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">Note: {child.notes}</p>
                        )}
                      </div>
                      {child.hasInfectiousDisease ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Infectious
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Healthy
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">No children registered yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={13} />
                Booking History ({bookings.length})
              </h2>
            </div>
            <div>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  <p>No bookings found for this parent</p>
                  <button onClick={() => navigate('/bookings')} className="mt-2 text-[#0d6d5c] text-xs font-bold hover:underline cursor-pointer">Create New Booking</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bookings.map((booking: any) => {
                    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG['Pending NA Selection'];
                    return (
                      <div
                        key={booking._id}
                        onClick={() => navigate(`/bookings/${booking._id}`)}
                        className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0d6d5c] flex items-center justify-center text-xs font-bold font-mono">
                              {booking.bookingNumber?.slice(-4) || 'BK'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">{booking.bookingNumber}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                                  {config.icon} {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                                {booking.dutyType && <span>{booking.dutyType}</span>}
                                {booking.requestedDates?.length > 0 && (
                                  <span>• {booking.requestedDates.length} date(s)</span>
                                )}
                                {booking.caregiverName && <span className="text-[#0d6d5c] font-semibold">• NA: {booking.caregiverName}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{formatDate(booking.createdAt)}</span>
                            <ChevronRight size={15} className="text-slate-300" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDetail;
