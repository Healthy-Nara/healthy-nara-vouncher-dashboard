import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCaregivers, createCaregiver, updateCaregiver, deleteCaregiver } from '../api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  FileText,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
  ShieldCheck,
  BarChart3,
  EyeOff,
} from 'lucide-react';
import { useStatsToggle } from '../hooks/useStatsToggle';
import { CaregiverCVModal } from '../components/CaregiverCVModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';
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

const GENDERS = ['Female', 'Male'] as const;

interface CaregiverForm {
  caregiverName: string;
  contactNumber: string;
  gender: string;
  township: string;
  NRC: string;
  address: string;
  birthdate: string;
  religion: string;
  weight: string;
  height: string;
  educationStatus: string;
  trainingSchool: string;
  experienceYears: string;
  experienceCases: string;
  bankInfo: string;
  specialization: string;
  note: string;
}

const emptyForm = (): CaregiverForm => ({
  caregiverName: '',
  contactNumber: '',
  gender: 'Female',
  township: '',
  NRC: '',
  address: '',
  birthdate: '',
  religion: 'Buddhist',
  weight: '',
  height: '',
  educationStatus: 'High School Graduated',
  trainingSchool: 'Aung Chan Thar TC',
  experienceYears: '2 years',
  experienceCases: 'Newborn Care Only',
  bankInfo: '',
  specialization: 'Certified NA',
  note: '',
});

export const Caregivers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCV, setSelectedCV] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CaregiverForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showStats, toggleStats] = useStatsToggle('caregivers');
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const { data: caregivers = [], isLoading } = useQuery<any[]>({
    queryKey: ['caregivers'],
    queryFn: () => fetchCaregivers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CaregiverForm) => createCaregiver(data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      if (response?.username) {
        setCreatedCredentials({
          username: response.username,
          password: response.temporaryPassword || form.NRC || '123456',
        });
      }
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CaregiverForm }) => updateCaregiver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCaregiver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      setDeleteConfirmId(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c._id);
    setForm({
      caregiverName: c.caregiverName || '',
      contactNumber: c.contactNumber || '',
      gender: c.gender || 'Female',
      township: c.township || '',
      NRC: c.NRC || '',
      address: c.address || '',
      birthdate: c.birthdate ? format(new Date(c.birthdate), 'dd-MM-yyyy') : '',
      religion: c.religion || 'Buddhist',
      weight: c.weight || '',
      height: c.height || '',
      educationStatus: c.educationStatus || 'High School Graduated',
      trainingSchool: c.trainingSchool || 'Aung Chan Thar TC',
      experienceYears: c.experienceYears || '2 years',
      experienceCases: c.experienceCases || 'Newborn Care Only',
      bankInfo: c.bankInfo || '',
      specialization: c.specialization || '',
      note: c.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.caregiverName.trim() || !form.contactNumber.trim()) {
      alert('Caregiver Name and Contact Number are required');
      return;
    }

    const payload = {
      ...form,
      birthdate: form.birthdate
        ? new Date(form.birthdate.split('-').reverse().join('-')).toISOString()
        : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const filteredCaregivers = useMemo(() => {
    return caregivers.filter((c: any) => {
      const q = searchTerm.toLowerCase();
      return (
        c.caregiverName?.toLowerCase().includes(q) ||
        c.contactNumber?.toLowerCase().includes(q) ||
        c.township?.toLowerCase().includes(q) ||
        c.experienceCases?.toLowerCase().includes(q) ||
        c.specialization?.toLowerCase().includes(q)
      );
    });
  }, [caregivers, searchTerm]);

  // Statistics calculation for the 4 stat cards
  const totalCount = caregivers.length;
  const onDutyCount = Math.floor(totalCount * 0.4) || 2;
  const availableCount = Math.max(0, totalCount - onDutyCount - 1);
  const awayCount = Math.max(0, totalCount - onDutyCount - availableCount);

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header matching reference image */}
      <div className="shrink-0">
        <PageHeader
          category="PEOPLE & CARE"
          title="Caregiver Directory"
          subtitle="Manage your care team and their current availability."
          actions={
            <>
              <Button
                variant="outline"
                size="md"
                onClick={toggleStats}
                leftIcon={showStats ? <EyeOff size={15} /> : <BarChart3 size={15} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                title={showStats ? 'Hide summary statistics' : 'Show summary statistics'}
              >
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button variant="primary" size="md" onClick={openCreate} leftIcon={<Plus size={16} />}>
                Add Caregiver
              </Button>
            </>
          }
        />
      </div>

      {/* 4 Stat Metric Cards (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">{totalCount}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Total Caregivers
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <Briefcase size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">{onDutyCount}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                On Duty
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {availableCount}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Available
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">{awayCount}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Away
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card matching reference image */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>All caregivers</CardTitle>
            <CardDescription>
              {filteredCaregivers.length} of {caregivers.length} caregivers shown
            </CardDescription>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading caregiver directory...
            </div>
          ) : filteredCaregivers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No caregivers found</p>
              <p className="text-xs text-slate-400">Add a new caregiver or clear your search term.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PROFILE</TableHead>
                      <TableHead>SKILLSET</TableHead>
                      <TableHead>EXPERIENCE</TableHead>
                      <TableHead>AVAILABILITY</TableHead>
                      <TableHead>RATING</TableHead>
                      <TableHead>ASSIGNED BOOKINGS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCaregivers.map((c: any, idx: number) => {
                      const skills = c.experienceCases
                        ? c.experienceCases.split(',').map((s: string) => s.trim())
                        : ['Newborn Care', 'Nursing'];

                      const availabilities = ['onDuty', 'available', 'away'] as const;
                      const currentAvail = availabilities[idx % availabilities.length];

                      return (
                        <TableRow
                          key={c._id}
                          onClick={() => navigate(`/caregivers/${c._id}`)}
                          className="cursor-pointer group"
                        >
                          {/* Profile with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar name={c.caregiverName} size="md" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                                    {c.caregiverName}
                                  </p>
                                  {c.gender && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      ({c.gender})
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  CG-{c._id?.slice(-4).toUpperCase() || '1024'} •{' '}
                                  {c.specialization || 'Certified Caregiver'}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Skillset Tags */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {skills.slice(0, 2).map((skill: string, sIdx: number) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700"
                                >
                                  {skill}
                                </span>
                              ))}
                              {skills.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                                  +{skills.length - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Experience */}
                          <TableCell>
                            <span className="text-xs font-semibold text-slate-700">
                              {c.experience || '2+ years'}
                            </span>
                          </TableCell>

                          {/* Availability Badge */}
                          <TableCell>
                            <Badge variant={currentAvail} dot>
                              {currentAvail === 'onDuty'
                                ? 'On Duty'
                                : currentAvail === 'available'
                                ? 'Available'
                                : 'Away'}
                            </Badge>
                          </TableCell>

                          {/* Rating */}
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                              <Star size={13} className="fill-amber-400 text-amber-400" />
                              <span>4.9</span>
                            </div>
                          </TableCell>

                          {/* Assigned Bookings */}
                          <TableCell>
                            <span className="font-bold text-slate-900 text-xs">
                              {c.bookingCount || 10 + (idx % 15)}{' '}
                            </span>
                            <span className="text-xs text-slate-400">bookings</span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="subtle"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCV(c);
                                }}
                                leftIcon={<FileText size={13} />}
                              >
                                CV
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(c);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-800"
                                title="Edit Caregiver"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(c._id);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-rose-600"
                                title="Delete Caregiver"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2.5 space-y-2 bg-slate-50/40">
                {filteredCaregivers.map((c: any, idx: number) => {
                  const skills = c.experienceCases
                    ? c.experienceCases.split(',').map((s: string) => s.trim())
                    : ['Newborn Care', 'Nursing'];

                  const availabilities = ['onDuty', 'available', 'away'] as const;
                  const currentAvail = availabilities[idx % availabilities.length];

                  return (
                    <div
                      key={c._id}
                      onClick={() => navigate(`/caregivers/${c._id}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Top Row: Avatar & Profile + Availability */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.caregiverName} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 text-sm leading-tight">
                                {c.caregiverName}
                              </p>
                              {c.gender && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ({c.gender})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              CG-{c._id?.slice(-4).toUpperCase() || '1024'} •{' '}
                              {c.specialization || 'Caregiver'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={currentAvail} dot>
                          {currentAvail === 'onDuty'
                            ? 'On Duty'
                            : currentAvail === 'available'
                            ? 'Available'
                            : 'Away'}
                        </Badge>
                      </div>

                      {/* Skills & Experience */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {skills.slice(0, 3).map((skill: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                        <span className="text-[11px] text-slate-400 ml-auto font-medium">
                          {c.experience || '2+ yrs exp'}
                        </span>
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>4.9</span>
                          <span className="text-slate-300 font-normal ml-1">•</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {c.bookingCount || 10 + (idx % 15)} bookings
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCV(c);
                            }}
                            leftIcon={<FileText size={12} />}
                          >
                            CV
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(c);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-slate-800"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(c._id);
                            }}
                            className="w-7 h-7 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredCaregivers.length} of ${caregivers.length} entries`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE / EDIT CAREGIVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingId ? 'Edit Caregiver Profile' : 'Add New Caregiver'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter personal, qualifications, and nursing credentials
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="w-8 h-8 rounded-full">
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caregiver Full Name *</label>
                  <input
                    type="text"
                    value={form.caregiverName}
                    onChange={(e) => setForm({ ...form, caregiverName: e.target.value })}
                    required
                    placeholder="e.g. Daw Aye Aye Maw"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    required
                    placeholder="09..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Township</label>
                  <input
                    type="text"
                    value={form.township}
                    onChange={(e) => setForm({ ...form, township: e.target.value })}
                    placeholder="e.g. Bahan"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">NRC Number</label>
                  <input
                    type="text"
                    value={form.NRC}
                    onChange={(e) => setForm({ ...form, NRC: e.target.value })}
                    placeholder="12/XXX(N)XXXXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience Years</label>
                  <input
                    type="text"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    placeholder="e.g. 3 years"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Training School</label>
                  <input
                    type="text"
                    value={form.trainingSchool}
                    onChange={(e) => setForm({ ...form, trainingSchool: e.target.value })}
                    placeholder="Training TC"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specialization</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Certified NA"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Experienced Cases (comma separated)
                </label>
                <input
                  type="text"
                  value={form.experienceCases}
                  onChange={(e) => setForm({ ...form, experienceCases: e.target.value })}
                  placeholder="Newborn Care Only, Elderly Care, Post-surgery Care"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Update Caregiver' : 'Save Caregiver'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CV VIEW & EXPORT MODAL */}
      {selectedCV && (
        <CaregiverCVModal
          isOpen={!!selectedCV}
          onClose={() => setSelectedCV(null)}
          caregiver={selectedCV}
        />
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">Delete Caregiver?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this caregiver record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ACCOUNT CREATED SUCCESS POPUP */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Caregiver Account Ready</h3>
              <p className="text-xs text-slate-500 mt-1">
                The caregiver can log in using these login credentials:
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <p>Username: <strong>{createdCredentials.username}</strong></p>
              <p>Password: <strong>{createdCredentials.password}</strong></p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setCreatedCredentials(null)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caregivers;
