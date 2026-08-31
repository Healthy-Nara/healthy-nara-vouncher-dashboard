import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCaregiverStats, updateCaregiver } from '../api';
import { useState } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Calendar, ChevronRight, Edit2, Banknote, TrendingUp, Clock, User, FileText, Copy, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import { CaregiverCVModal } from '../components/CaregiverCVModal';

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
  const [showCVModal, setShowCVModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    caregiverName: '',
    username: '',
    contactNumber: '',
    gender: '',
    township: '',
    NRC: '',
    address: '',
    birthdate: '',
    religion: 'Buddhist',
    weight: '',
    height: '',
    educationStatus: '',
    trainingSchool: '',
    experienceYears: '',
    experienceCases: '',
    bankInfo: '',
    specialization: '',
    note: '',
  });

  const getFallbackUsername = (name?: string) => {
    return name ? name.toLowerCase().replace(/\s/g, '') : '';
  };

  const getFallbackPassword = (nrc?: string) => {
    if (!nrc) return '123456';
    const match = nrc.match(/(\d+)$/);
    return match ? match[1] : '123456';
  };

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
      username: c?.username || getFallbackUsername(c?.caregiverName),
      contactNumber: c?.contactNumber || '',
      gender: c?.gender || '',
      township: c?.township || '',
      NRC: c?.NRC || '',
      address: c?.address || '',
      birthdate: c?.birthdate ? format(new Date(c.birthdate), 'dd-MM-yyyy') : '',
      religion: c?.religion || 'Buddhist',
      weight: c?.weight || '',
      height: c?.height || '',
      educationStatus: c?.educationStatus || '',
      trainingSchool: c?.trainingSchool || '',
      experienceYears: c?.experienceYears || '',
      experienceCases: c?.experienceCases || '',
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
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/caregivers')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Caregivers"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{c.caregiverName}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0d6d5c] border border-teal-200">
                Verified Caregiver
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{c.contactNumber} • {c.township || 'Yangon'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowCVModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0d6d5c] hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <FileText size={14} />
          <span>Generate CV</span>
        </button>
      </div>

      <CaregiverCVModal
        isOpen={showCVModal}
        onClose={() => setShowCVModal(false)}
        caregiver={c}
        stats={{
          bookingCount: stats.bookingCount,
          completedCount: stats.bookings?.filter((b: any) => b.status === 'Completed').length,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* NA Mobile App Login Account */}
          <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/10 rounded-2xl p-4 border border-teal-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0d6d5c] text-white flex items-center justify-center shadow-xs">
                  <KeyRound size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">NA Mobile Login</h3>
                  <p className="text-[10px] text-[#0d6d5c] font-semibold">Duty & Daily Report Portal</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const u = c.username || getFallbackUsername(c.caregiverName);
                  const p = c.defaultPassword || getFallbackPassword(c.NRC);
                  copyToClipboard(`Caregiver: ${c.caregiverName}\nUsername: ${u}\nPassword: ${p}`, 'all');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-teal-50 text-[#0d6d5c] text-[11px] font-bold rounded-xl border border-teal-200 shadow-2xs transition-all cursor-pointer"
                title="Copy both username and password"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check size={12} className="text-teal-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 pt-0.5">
              {/* Username Field */}
              <div className="bg-white p-2.5 rounded-xl border border-teal-100/90 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Username</span>
                  <span className="text-xs font-mono font-bold text-slate-800 select-all truncate block">
                    {c.username || getFallbackUsername(c.caregiverName)}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(c.username || getFallbackUsername(c.caregiverName), 'username')}
                  className="p-1.5 text-slate-400 hover:text-[#0d6d5c] hover:bg-teal-50 rounded-lg transition-all cursor-pointer shrink-0"
                  title="Copy Username"
                >
                  {copiedField === 'username' ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Password Field */}
              <div className="bg-white p-2.5 rounded-xl border border-teal-100/90 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Password</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-teal-50 text-[#0d6d5c] font-bold border border-teal-200/60">
                      Default from NRC
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-800 select-all tracking-wider block">
                    {showPassword ? (c.defaultPassword || getFallbackPassword(c.NRC)) : '••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(c.defaultPassword || getFallbackPassword(c.NRC), 'password')}
                    className="p-1.5 text-slate-400 hover:text-[#0d6d5c] hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Caregiver Info */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <User size={12} /> Caregiver Info
              </h2>
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
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Name</label>
                    <input type="text" value={editForm.caregiverName} onChange={e => setEditForm({ ...editForm, caregiverName: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Username (NA Mobile Login)</label>
                    <input type="text" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-primary focus:border-primary" placeholder="e.g. ayeayemaw" />
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
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Religion</label>
                    <input type="text" value={editForm.religion} onChange={e => setEditForm({ ...editForm, religion: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Weight</label>
                      <input type="text" value={editForm.weight} onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. 120 lb" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Height</label>
                      <input type="text" value={editForm.height} onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. 5 ft 3 in" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Education Status</label>
                    <input type="text" value={editForm.educationStatus} onChange={e => setEditForm({ ...editForm, educationStatus: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. High School Graduated" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Training School</label>
                    <input type="text" value={editForm.trainingSchool} onChange={e => setEditForm({ ...editForm, trainingSchool: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. Aung Chan Thar TC" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Experience Years</label>
                      <input type="text" value={editForm.experienceYears} onChange={e => setEditForm({ ...editForm, experienceYears: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. 2 years" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Experience Cases</label>
                      <input type="text" value={editForm.experienceCases} onChange={e => setEditForm({ ...editForm, experienceCases: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. Newborn Care" />
                    </div>
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
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Username (NA Login)</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-mono font-bold text-gray-900 select-all">
                        {c.username || getFallbackUsername(c.caregiverName)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(c.username || getFallbackUsername(c.caregiverName), 'info-username')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-[#0d6d5c] hover:bg-teal-50 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                        title="Copy Username"
                      >
                        {copiedField === 'info-username' ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                        <span>{copiedField === 'info-username' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-gray-500 uppercase">Password (NA Login)</p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-[#0d6d5c] font-semibold border border-teal-200/50">
                        Default from NRC
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-mono font-bold text-gray-900 tracking-wider select-all">
                        {showPassword ? (c.defaultPassword || getFallbackPassword(c.NRC)) : '••••••••'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(c.defaultPassword || getFallbackPassword(c.NRC), 'info-password')}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-[#0d6d5c] hover:bg-teal-50 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === 'info-password' ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                          <span>{copiedField === 'info-password' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {c.gender && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Gender</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary capitalize">
                        {c.gender}
                      </span>
                    </div>
                  )}
                  {c.religion && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Religion</p>
                      <p className="text-sm text-gray-900">{c.religion}</p>
                    </div>
                  )}
                  {(c.weight || c.height) && (
                    <div className="grid grid-cols-2 gap-2">
                      {c.weight && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Weight</p>
                          <p className="text-sm text-gray-900">{c.weight}</p>
                        </div>
                      )}
                      {c.height && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Height</p>
                          <p className="text-sm text-gray-900">{c.height}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {c.educationStatus && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Education Status</p>
                      <p className="text-sm text-gray-900">{c.educationStatus}</p>
                    </div>
                  )}
                  {c.trainingSchool && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Training School</p>
                      <p className="text-sm text-gray-900">{c.trainingSchool}</p>
                    </div>
                  )}
                  {(c.experienceYears || c.experienceCases) && (
                    <div className="grid grid-cols-2 gap-2">
                      {c.experienceYears && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Experience Years</p>
                          <p className="text-sm text-gray-900">{c.experienceYears}</p>
                        </div>
                      )}
                      {c.experienceCases && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Experience Cases</p>
                          <p className="text-sm text-gray-900">{c.experienceCases}</p>
                        </div>
                      )}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
                <p className="text-base font-black text-emerald-700 font-mono">{fmt(stats.totalPaid)} MMK</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Payout</p>
                <p className="text-base font-black text-amber-700 font-mono">{fmt(stats.totalPending)} MMK</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                <Banknote size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
                <p className="text-base font-black text-slate-900 font-mono">{stats.invoiceCount}</p>
              </div>
            </div>
          </div>

          {/* Assigned Bookings */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={13} />
                Assigned Bookings ({stats.bookingCount})
              </h2>
            </div>
            <div>
              {stats.bookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  <p>No bookings assigned yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.bookings.map((booking: any) => {
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
                                {booking.parent?.parentName && <span className="text-slate-600 font-semibold">{booking.parent.parentName}</span>}
                                {booking.dutyType && <span>• {booking.dutyType}</span>}
                                {booking.requestedDates?.length > 0 && (
                                  <span>• {booking.requestedDates.length} date(s)</span>
                                )}
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

export default CaregiverDetail;
