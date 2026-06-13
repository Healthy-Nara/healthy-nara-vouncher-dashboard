import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCaregiverStats, updateCaregiver } from '../api';
import { useState } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Calendar, ChevronRight, Edit2, Banknote, TrendingUp, Clock, User } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Pending NA Selection': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  'Assigned':            { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '🔵' },
  'Completed':           { color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  'Cancelled':           { color: 'text-red-700',    bg: 'bg-red-100',    icon: '❌' },
};

const CaregiverDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    caregiverName: '',
    contactNumber: '',
    gender: '',
    township: '',
    NRC: '',
    address: '',
    birthdate: '',
    bankInfo: '',
    specialization: '',
    note: '',
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['caregiverStats', id],
    queryFn: () => fetchCaregiverStats(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const toIso = (d: string) => d ? new Date(d.split('-').reverse().join('-')).toISOString() : d;
      const payload = { ...data, birthdate: toIso(data.birthdate) };
      return updateCaregiver(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiverStats', id] });
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      setIsEditing(false);
    },
  });

  const startEdit = () => {
    const c = stats?.caregiver;
    setEditForm({
      caregiverName: c?.caregiverName || '',
      contactNumber: c?.contactNumber || '',
      gender: c?.gender || '',
      township: c?.township || '',
      NRC: c?.NRC || '',
      address: c?.address || '',
      birthdate: c?.birthdate ? format(new Date(c.birthdate), 'dd-MM-yyyy') : '',
      bankInfo: c?.bankInfo || '',
      specialization: c?.specialization || '',
      note: c?.note || '',
    });
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  };

  const fmt = (n: number) => n?.toLocaleString() || '0';

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!stats?.caregiver) return <div className="text-center py-12 text-gray-500">Caregiver not found</div>;

  const c = stats.caregiver;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/caregivers')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{c.caregiverName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{c.contactNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Caregiver Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <User size={12} /> Caregiver Info
              </h2>
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
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Name</label>
                    <input type="text" value={editForm.caregiverName} onChange={e => setEditForm({ ...editForm, caregiverName: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Contact</label>
                    <input type="text" value={editForm.contactNumber} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Township</label>
                    <input type="text" value={editForm.township} onChange={e => setEditForm({ ...editForm, township: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">NRC</label>
                    <input type="text" value={editForm.NRC} onChange={e => setEditForm({ ...editForm, NRC: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Address</label>
                    <textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Birthdate</label>
                    <CustomDatePicker
                      selected={editForm.birthdate ? new Date(editForm.birthdate.split('-').reverse().join('-')) : new Date()}
                      onChange={(date) => setEditForm({ ...editForm, birthdate: format(date, 'dd-MM-yyyy') })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Bank Info</label>
                    <input type="text" value={editForm.bankInfo} onChange={e => setEditForm({ ...editForm, bankInfo: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Specialization</label>
                    <input type="text" value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Note</label>
                    <textarea rows={2} value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)}
                      className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2">
                      Cancel
                    </button>
                    <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.caregiverName || updateMutation.isPending}
                      className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2 disabled:opacity-50">
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{c.caregiverName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Phone</p>
                    <a href={`tel:${c.contactNumber}`} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                      <Phone size={12} /> {c.contactNumber}
                    </a>
                  </div>
                  {c.gender && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Gender</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary capitalize">
                        {c.gender}
                      </span>
                    </div>
                  )}
                  {c.township && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Township</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1"><MapPin size={12} className="text-gray-400" /> {c.township}</p>
                    </div>
                  )}
                  {c.NRC && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">NRC</p>
                      <p className="text-sm text-gray-900">{c.NRC}</p>
                    </div>
                  )}
                  {c.address && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Address</p>
                      <p className="text-sm text-gray-700">{c.address}</p>
                    </div>
                  )}
                  {c.birthdate && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Birthdate</p>
                      <p className="text-sm text-gray-900">{formatDate(c.birthdate)}</p>
                    </div>
                  )}
                  {c.bankInfo && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Bank Info</p>
                      <p className="text-sm text-gray-900">{c.bankInfo}</p>
                    </div>
                  )}
                  {c.specialization && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Specialization</p>
                      <p className="text-sm text-gray-900">{c.specialization}</p>
                    </div>
                  )}
                  {c.note && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Note</p>
                      <p className="text-sm text-gray-700">{c.note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payout Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-100 text-green-700">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Paid</p>
                  <p className="text-base font-black text-green-700">{fmt(stats.totalPaid)} MMK</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Pending</p>
                  <p className="text-base font-black text-orange-700">{fmt(stats.totalPending)} MMK</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Banknote size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Invoices</p>
                  <p className="text-base font-black text-primary">{stats.invoiceCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                <Calendar size={12} className="inline mr-1" />
                Assigned Bookings ({stats.bookingCount})
              </h2>
            </div>
            <div>
              {stats.bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>No bookings assigned yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats.bookings.map((booking: any) => {
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
                                {booking.parent?.parentName && <span>{booking.parent.parentName}</span>}
                                {booking.dutyType && <span>{booking.dutyType}</span>}
                                {booking.requestedDates?.length > 0 && (
                                  <span>{booking.requestedDates.length} date(s)</span>
                                )}
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

export default CaregiverDetail;
