import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchParentById, fetchParentBookings, updateParent } from '../api';
import { useState } from 'react';
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
    });
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!parent) return <div className="text-center py-12 text-gray-500">Parent not found</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/parents')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{parent.parentName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{parent.contactNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Parent Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">Parent Info</h2>
              {!isEditing && (
                <button onClick={startEdit} className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Parent Name</label>
                    <input type="text" value={editForm.parentName} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Contact Number</label>
                    <input type="text" value={editForm.contactNumber} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Township</label>
                    <input type="text" value={editForm.township} onChange={e => setEditForm({ ...editForm, township: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Address</label>
                    <textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Religion</label>
                    <select value={editForm.religion} onChange={e => setEditForm({ ...editForm, religion: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                      <option value="">Select Religion</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Nearest Bus Stop</label>
                    <input type="text" value={editForm.nearestBusStop} onChange={e => setEditForm({ ...editForm, nearestBusStop: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Duration (Bus Stop to Home)</label>
                    <input type="text" value={editForm.durationOfBusStopToHome} onChange={e => setEditForm({ ...editForm, durationOfBusStopToHome: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)}
                      className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2">
                      Cancel
                    </button>
                    <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.parentName || updateMutation.isPending}
                      className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2 disabled:opacity-50">
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{parent.parentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Phone</p>
                    <a href={`tel:${parent.contactNumber}`} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                      <Phone size={12} /> {parent.contactNumber}
                    </a>
                  </div>
                  {parent.township && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Township</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1"><MapPin size={12} className="text-gray-400" /> {parent.township}</p>
                    </div>
                  )}
                  {parent.address && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Address</p>
                      <p className="text-sm text-gray-700">{parent.address}</p>
                    </div>
                  )}
                  {parent.religion && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Religion</p>
                      <p className="text-sm text-gray-900">{parent.religion}</p>
                    </div>
                  )}
                  {parent.nearestBusStop && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Nearest Bus Stop</p>
                      <p className="text-sm text-gray-900">{parent.nearestBusStop}</p>
                    </div>
                  )}
                  {parent.durationOfBusStopToHome && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Duration (Bus Stop to Home)</p>
                      <p className="text-sm text-gray-900">{parent.durationOfBusStopToHome}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Children */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <Baby size={12} /> Children ({parent.children?.length || 0})
              </h2>
            </div>
            <div className="p-5">
              {parent.children && parent.children.length > 0 ? (
                <div className="space-y-2">
                  {parent.children.map((child: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        <Baby size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{child.childName}</p>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          {child.birthDate && <span>{new Date(child.birthDate).toLocaleDateString()}</span>}
                          {child.gender && <span>{child.gender}</span>}
                          {child.hasInfectiousDisease && <span className="text-red-500">Infectious</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No children added yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                <Calendar size={12} className="inline mr-1" />
                Booking History ({bookings.length})
              </h2>
            </div>
            <div>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>No bookings found for this parent</p>
                  <button onClick={() => navigate('/bookings')} className="mt-2 text-primary text-xs font-bold hover:underline">Create Booking</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {bookings.map((booking: any) => {
                    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG['Pending NA Selection'];
                    return (
                      <div
                        key={booking._id}
                        onClick={() => navigate(`/bookings/${booking._id}`)}
                        className="px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {booking.bookingNumber?.slice(-4)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{booking.bookingNumber}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                                  {config.icon} {booking.status === 'Pending NA Selection' ? 'Pending' : booking.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                                {booking.dutyType && <span>{booking.dutyType}</span>}
                                {booking.requestedDates?.length > 0 && (
                                  <span>{booking.requestedDates.length} date(s)</span>
                                )}
                                {booking.caregiverName && <span className="text-primary">NA: {booking.caregiverName}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{formatDate(booking.createdAt)}</span>
                            <ChevronRight size={16} className="text-gray-300" />
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
