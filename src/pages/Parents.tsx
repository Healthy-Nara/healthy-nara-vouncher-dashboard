import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchParents, createParent, updateParent, deleteParent, importParents } from '../api';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Baby,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
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

interface ChildEntry {
  childName: string;
  age: number | '';
  ageType: 'month' | 'year';
  gender: 'Male' | 'Female' | '';
  notes: string;
  hasInfectiousDisease: boolean;
}

interface ParentForm {
  parentName: string;
  contactNumber: string;
  township: string;
  address: string;
  religion: string;
  nearestBusStop: string;
  durationOfBusStopToHome: string;
  status: string;
  profession: string;
  children: ChildEntry[];
}

const emptyChild = (): ChildEntry => ({
  childName: '',
  age: '',
  ageType: 'year',
  gender: '',
  notes: '',
  hasInfectiousDisease: false,
});

const emptyForm = (): ParentForm => ({
  parentName: '',
  contactNumber: '',
  township: '',
  address: '',
  religion: 'Buddhist',
  nearestBusStop: '',
  durationOfBusStopToHome: '',
  status: 'Inactive',
  profession: '',
  children: [emptyChild()],
});

const PARENT_STATUSES = ['Daily', 'Weekly', 'Monthly', 'Custom', 'Inactive'] as const;

export const Parents = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ParentForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: any[] } | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);

  const { data: parents = [], isLoading } = useQuery<any[]>({
    queryKey: ['parents'],
    queryFn: () => fetchParents(),
  });

  const importMutation = useMutation({
    mutationFn: (data: any[]) => importParents(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setImportResult({
        successCount: res.importedCount || 0,
        errors: res.errors || [],
      });
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      setImportError(err.message || 'Import failed. Please verify format.');
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (!rows.length) {
          setImportError('Excel sheet is empty');
          setImporting(false);
          return;
        }

        const formattedParents = rows.map((row) => {
          const rawStatus = row['Status'] || row['status'] || 'Inactive';
          const validStatus = PARENT_STATUSES.includes(rawStatus) ? rawStatus : 'Inactive';

          const children: ChildEntry[] = [];
          const childName = row['Child Name'] || row['childName'];
          if (childName) {
            const rawAge = row['Child Age'] || row['childAge'];
            const ageType = String(row['Age Type'] || row['ageType'] || 'year').toLowerCase() === 'month' ? 'month' : 'year';
            const gender = row['Child Gender'] || row['childGender'];
            children.push({
              childName,
              age: rawAge ? Number(rawAge) : '',
              ageType,
              gender: gender === 'Male' || gender === 'Female' ? gender : '',
              notes: row['Child Notes'] || '',
              hasInfectiousDisease: false,
            });
          }

          return {
            parentName: row['Parent Name'] || row['parentName'] || '',
            contactNumber: String(row['Phone Number'] || row['contactNumber'] || ''),
            township: row['Township'] || row['township'] || '',
            address: row['Address'] || row['address'] || '',
            religion: row['Religion'] || 'Buddhist',
            status: validStatus,
            profession: row['Profession'] || '',
            children: children.length ? children : [emptyChild()],
          };
        });

        importMutation.mutate(formattedParents);
      } catch (err: any) {
        setImportError(`File parse error: ${err.message}`);
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const createMutation = useMutation({
    mutationFn: (data: ParentForm) => createParent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ParentForm }) => updateParent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteParent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
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

  const openEdit = (p: any) => {
    setEditingId(p._id);
    setForm({
      parentName: p.parentName || '',
      contactNumber: p.contactNumber || '',
      township: p.township || '',
      address: p.address || '',
      religion: p.religion || 'Buddhist',
      nearestBusStop: p.nearestBusStop || '',
      durationOfBusStopToHome: p.durationOfBusStopToHome || '',
      status: p.status || 'Inactive',
      profession: p.profession || '',
      children: p.children?.length ? p.children : [emptyChild()],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName.trim() || !form.contactNumber.trim()) {
      alert('Parent Name and Contact Number are required');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const addChild = () => {
    setForm((prev) => ({
      ...prev,
      children: [...prev.children, emptyChild()],
    }));
  };

  const removeChild = (index: number) => {
    if (form.children.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const updateChild = (index: number, field: keyof ChildEntry, val: any) => {
    setForm((prev) => {
      const updated = [...prev.children];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, children: updated };
    });
  };

  const filteredParents = useMemo(() => {
    return parents.filter((p: any) => {
      const q = searchTerm.toLowerCase();
      return (
        p.parentName?.toLowerCase().includes(q) ||
        p.contactNumber?.toLowerCase().includes(q) ||
        p.township?.toLowerCase().includes(q) ||
        p.children?.some((c: any) => c.childName?.toLowerCase().includes(q))
      );
    });
  }, [parents, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Daily':
        return <Badge variant="emerald" dot>Daily</Badge>;
      case 'Weekly':
        return <Badge variant="sky" dot>Weekly</Badge>;
      case 'Monthly':
        return <Badge variant="purple" dot>Monthly</Badge>;
      case 'Custom':
        return <Badge variant="amber" dot>Custom</Badge>;
      default:
        return <Badge variant="slate" dot>Inactive</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="CUSTOMER DIRECTORY"
          title="Parents & Families"
          subtitle="Manage customer profiles, child records, and home service details."
          actions={
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={importing}
                leftIcon={
                  importing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )
                }
              >
                {importing ? 'Importing...' : 'Import Excel'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={openCreate}
                leftIcon={<Plus size={16} />}
              >
                Add Parent
              </Button>
            </>
          }
        />
      </div>

      {/* Import Status Alert */}
      {importError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs shrink-0">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {importResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs shrink-0">
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <span>
            Successfully imported <strong>{importResult.successCount}</strong> parent records.
          </span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="shrink-0 flex justify-end">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Search by parent or child..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading parents directory...
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No parents found</p>
              <p className="text-xs text-slate-400">Add a new family or clear search term.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>PARENT NAME</TableHead>
                      <TableHead>CONTACT & LOCATION</TableHead>
                      <TableHead>CHILDREN</TableHead>
                      <TableHead>PLAN STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParents.map((p: any, index: number) => {
                      const children = p.children || [];
                      return (
                        <TableRow
                          key={p._id}
                          onClick={() => navigate(`/parents/${p._id}`)}
                          className="cursor-pointer group"
                        >
                          {/* Row Number */}
                          <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold w-12">
                            {index + 1}
                          </TableCell>

                          {/* Parent Name */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar name={p.parentName} size="sm" />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                                  {p.parentName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {p.profession || 'Customer'}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact & Location */}
                          <TableCell>
                            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <Phone size={12} className="text-teal-600" />
                              <span>{p.contactNumber || '—'}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <MapPin size={11} className="text-slate-400" />
                              <span>{p.township || 'Yangon'}</span>
                            </p>
                          </TableCell>

                          {/* Children */}
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {children.length === 0 ? (
                                <span className="text-xs text-slate-400">—</span>
                              ) : (
                                children.map((c: any, cIdx: number) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-bold"
                                  >
                                    <Baby size={11} className="text-teal-600" />
                                    <span>{c.childName || 'Child'}</span>
                                    {c.age && (
                                      <span className="text-[10px] opacity-70">
                                        ({c.age} {c.ageType === 'month' ? 'm' : 'y'})
                                      </span>
                                    )}
                                  </span>
                                ))
                              )}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>{getStatusBadge(p.status || 'Inactive')}</TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/parents/${p._id}`);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-700"
                                title="View Profile"
                              >
                                <ChevronRight size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(p);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-700"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(p._id);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-rose-600"
                                title="Delete"
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
                {filteredParents.map((p: any) => {
                  const children = p.children || [];
                  return (
                    <div
                      key={p._id}
                      onClick={() => navigate(`/parents/${p._id}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Top Row: Avatar & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.parentName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {p.parentName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.profession || 'Customer'}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(p.status || 'Inactive')}
                      </div>

                      {/* Contact & Location */}
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Phone size={12} className="text-teal-600" />
                          <span>{p.contactNumber || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <MapPin size={12} />
                          <span>{p.township || 'Yangon'}</span>
                        </span>
                      </div>

                      {/* Children Tags */}
                      {children.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {children.map((c: any, cIdx: number) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-bold"
                            >
                              <Baby size={11} className="text-teal-600" />
                              <span>{c.childName || 'Child'}</span>
                              {c.age && (
                                <span className="text-[10px] opacity-70">
                                  ({c.age} {c.ageType === 'month' ? 'm' : 'y'})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100/80">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
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
                            setDeleteConfirmId(p._id);
                          }}
                          className="w-7 h-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </Button>
                        <ChevronRight size={15} className="text-slate-400 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredParents.length} of ${parents.length} families`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE / EDIT PARENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingId ? 'Edit Parent Profile' : 'Register New Family'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter parent contacts and child information
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="w-8 h-8 rounded-full">
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent Full Name *</label>
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    required
                    placeholder="e.g. Daw Khin Khin"
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
                  <label className="font-bold text-slate-700 block mb-1">Township</label>
                  <input
                    type="text"
                    value={form.township}
                    onChange={(e) => setForm({ ...form, township: e.target.value })}
                    placeholder="e.g. Kamayut"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {PARENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Profession</label>
                  <input
                    type="text"
                    value={form.profession}
                    onChange={(e) => setForm({ ...form, profession: e.target.value })}
                    placeholder="e.g. Business Owner"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Home Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, Building, Ward..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              {/* Children Section */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">Children Information</label>
                  <Button variant="subtle" size="xs" onClick={addChild} leftIcon={<Plus size={13} />}>
                    Add Child
                  </Button>
                </div>

                {form.children.map((child, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px]">Child #{idx + 1}</span>
                      {form.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={child.childName}
                        onChange={(e) => updateChild(idx, 'childName', e.target.value)}
                        placeholder="Child name"
                        className="p-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={child.age}
                          onChange={(e) =>
                            updateChild(idx, 'age', e.target.value ? Number(e.target.value) : '')
                          }
                          placeholder="Age"
                          className="w-20 p-2 rounded-xl border border-slate-200 bg-white"
                        />
                        <select
                          value={child.ageType}
                          onChange={(e) => updateChild(idx, 'ageType', e.target.value)}
                          className="p-2 rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="year">Years</option>
                          <option value="month">Months</option>
                        </select>
                      </div>
                      <select
                        value={child.gender}
                        onChange={(e) => updateChild(idx, 'gender', e.target.value)}
                        className="p-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">Gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                  </div>
                ))}
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
                  {editingId ? 'Update Family' : 'Save Family'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">Delete Family Record?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this parent and their child records?
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
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parents;
