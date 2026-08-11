import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchParents, createParent, updateParent, deleteParent, importParents } from '../api';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, X, Upload, Loader2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

const RELIGIONS = ['Buddhist', 'Christian', 'Muslim', 'Hindu', 'Other'] as const;

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

const emptyChild = (): ChildEntry => ({ childName: '', age: '', ageType: 'year', gender: '', notes: '', hasInfectiousDisease: false });

const emptyForm = (): ParentForm => ({
  parentName: '', contactNumber: '', township: '', address: '',
  religion: 'Buddhist', nearestBusStop: '', durationOfBusStopToHome: '',
  status: 'Inactive',
  profession: '',
  children: [emptyChild()],
});

const PARENT_STATUSES = ['Daily', 'Weekly', 'Monthly', 'Custom', 'Inactive'] as const;

const STATUS_STYLE: Record<string, string> = {
  Daily: 'bg-green-100 text-green-800 border-green-200',
  Weekly: 'bg-blue-100 text-blue-800 border-blue-200',
  Monthly: 'bg-purple-100 text-purple-800 border-purple-200',
  Custom: 'bg-amber-100 text-amber-800 border-amber-200',
  Inactive: 'bg-gray-100 text-gray-800 border-gray-200',
};

const Parents = () => {
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
  const [importResult, setImportResult] = useState<{ successCount: number; errors: any[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { data: parents, isLoading } = useQuery({
    queryKey: ['parents'],
    queryFn: fetchParents,
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
    }
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

        // Check if data is formatted as "one child per row" (needs grouping by parent name / contact)
        // Group by parentName + contactNumber to aggregate children
        const parentGroups: { [key: string]: any } = {};

        rows.forEach((row) => {
          const parentName = (row['Parent Name'] || row['parentName'] || row['Name'] || '').trim();
          if (!parentName) return;

          const contactNumber = String(row['Parent Contact'] || row['Parent Contact Number'] || row['Contact Number'] || row['contactNumber'] || row['Phone'] || '').trim();
          const key = `${parentName}_${contactNumber}`;

          const township = row['Township'] || row['township'] || '';
          const address = row['Address'] || row['address'] || '';
          const religion = row['Religion'] || row['religion'] || 'Buddhist';
          const nearestBusStop = row['Nearest Bus Stop'] || row['nearestBusStop'] || '';
          const durationOfBusStopToHome = row['Bus Stop to Home Duration'] || row['Duration To Bus Stop'] || row['durationOfBusStopToHome'] || '';
          const profession = row['Profession'] || row['Job'] || row['Profession/Job'] || row['profession'] || row['job'] || '';

          if (!parentGroups[key]) {
            parentGroups[key] = {
              parentName,
              contactNumber,
              township,
              address,
              religion,
              nearestBusStop,
              durationOfBusStopToHome,
              profession,
              children: []
            };
          }

          // Check if there is a child in this row (flat layout: "Child Name", "Birth Date", "Gender", etc.)
          const flatChildName = row['Child Name'] || row['childName'] || '';
          if (flatChildName) {
            const birthDate = row['Birth Date'] || row['birthDate'] || undefined;
            const genderVal = row['Gender'] || row['gender'] || '';
            const gender = String(genderVal).toLowerCase().startsWith('f') ? 'Female' : String(genderVal).toLowerCase().startsWith('m') ? 'Male' : undefined;
            const hasInfectiousDisease = String(row['Infectious Disease'] || row['hasInfectiousDisease'] || '').toLowerCase().startsWith('y') || String(row['Infectious Disease'] || '').toLowerCase() === 'yes';

            parentGroups[key].children.push({
              childName: flatChildName,
              birthDate: birthDate ? new Date(birthDate) : undefined,
              gender,
              hasInfectiousDisease
            });
          }

          // Check for multi-column child layout (Child 1 Name, Child 2 Name, etc.)
          for (let i = 1; i <= 5; i++) {
            const childName = row[`Child ${i} Name`] || row[`child${i}Name`] || '';
            if (childName) {
              const ageVal = row[`Child ${i} Age`] || row[`child${i}Age`];
              const ageType = String(row[`Child ${i} Age Type`] || row[`child${i}AgeType`] || 'year').toLowerCase().includes('month') ? 'month' : 'year';
              const genderVal = row[`Child ${i} Gender`] || row[`child${i}Gender`] || '';
              const gender = String(genderVal).toLowerCase().startsWith('f') ? 'Female' : String(genderVal).toLowerCase().startsWith('m') ? 'Male' : undefined;

              parentGroups[key].children.push({
                childName,
                age: ageVal ? parseInt(ageVal, 10) : undefined,
                ageType,
                gender,
              });
            }
          }
        });

        const formattedParents = Object.values(parentGroups);

        if (!formattedParents.length) {
          setImportError('No valid parent records found. Please ensure you have a "Parent Name" column.');
          setImporting(false);
          return;
        }

        importMutation.mutate(formattedParents);
      } catch (err: any) {
        setImportError(`Failed to parse file: ${err.message}`);
        setImporting(false);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file.');
      setImporting(false);
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
      children: p.children?.length ? p.children.map((c: any) => ({
        childName: c.childName || '',
        age: c.age ?? '',
        ageType: c.ageType || 'year',
        gender: c.gender || '',
        notes: c.notes || '',
        hasInfectiousDisease: !!c.hasInfectiousDisease,
      })) : [emptyChild()],
    });
    setEditingId(p._id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanChildren = form.children.filter(c => c.childName.trim());
    const payload = { ...form, children: cleanChildren };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const updateChild = (index: number, field: keyof ChildEntry, value: any) => {
    const updated = [...form.children];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, children: updated });
  };

  const addChild = () => setForm({ ...form, children: [...form.children, emptyChild()] });
  const removeChild = (index: number) => {
    if (form.children.length <= 1) return;
    setForm({ ...form, children: form.children.filter((_, i) => i !== index) });
  };

  const filtered = parents?.filter((p: any) =>
    p.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contactNumber?.includes(searchTerm)
  );

  const input = 'mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm';
  const label = 'block text-xs font-semibold text-gray-600 mb-0.5';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Parent Profiles</h1>
          <p className="mt-1 text-sm text-gray-500">Manage parents and their children for caregiver booking.</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
          <button onClick={handleImportClick} disabled={importing}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all gap-2 disabled:opacity-50">
            {importing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} Import Excel
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all gap-2">
            <Plus size={18} /> Add Parent
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-red-800">Import Failed</h4>
            <p className="text-xs text-red-700 mt-1">{importError}</p>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 ${importResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          {importResult.errors.length > 0 ? (
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          ) : (
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
          )}
          <div>
            <h4 className={`text-sm font-bold ${importResult.errors.length > 0 ? 'text-amber-800' : 'text-green-800'}`}>
              Import Completed
            </h4>
            <p className="text-xs text-gray-700 mt-1">
              Successfully imported <strong>{importResult.successCount}</strong> records.
              {importResult.errors.length > 0 && ` Failed to import ${importResult.errors.length} records.`}
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1 bg-white/55 p-2 rounded border border-amber-200/50">
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-[11px] text-amber-900">
                    Row {err.index + 2}: {err.error}
                  </p>
                ))}
                {importResult.errors.length > 10 && (
                  <p className="text-[10px] text-gray-500 italic">and {importResult.errors.length - 10} more errors...</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search parents..."
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 focus:ring-primary focus:border-primary sm:text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase w-12">No.</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Township</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Religion</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Children</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500">No parents found.</td></tr>
              ) : (
                filtered?.map((p: any, index: number) => (
                  <tr key={p._id} onClick={() => navigate(`/parents/${p._id}`)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.parentName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.contactNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.township || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                        {p.religion || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${STATUS_STYLE[p.status || 'Inactive'] || STATUS_STYLE.Inactive}`}>
                        {p.status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.children?.length ? (
                        <div className="space-y-0.5">
                          <span className="text-gray-600 font-medium">{p.children.length} child{p.children.length > 1 ? 'ren' : ''}</span>
                          {p.children.map((c: any, i: number) => (
                            <p key={i} className="text-[11px] text-gray-400">
                              {c.childName}{c.age != null ? ` (${c.age} ${c.ageType === 'month' ? 'mths' : 'yrs'})` : ''}
                            </p>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/parents/${p._id}`); }}
                          title="View Details"
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                          title="Edit Parent"
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p._id); }}
                          title="Delete Parent"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Parent?</h3>
            <p className="text-sm text-gray-500 mb-6">This will also remove references from related invoices. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deleteConfirmId)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Parent' : 'Add New Parent'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Parent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={label}>Parent Name *</label>
                  <input required className={input} value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Aung Thuyein Hein" />
                </div>
                <div>
                  <label className={label}>Contact Number</label>
                  <input className={input} value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="e.g. 0924345" />
                </div>
                <div>
                  <label className={label}>Township</label>
                  <input className={input} value={form.township}
                    onChange={(e) => setForm({ ...form, township: e.target.value })} placeholder="e.g. YGN" />
                </div>
                <div className="md:col-span-2">
                  <label className={label}>Address</label>
                  <input className={input} value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. aftrtrh" />
                </div>
                <div>
                  <label className={label}>Religion</label>
                  <select className={input} value={form.religion}
                    onChange={(e) => setForm({ ...form, religion: e.target.value })}>
                    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Nearest Bus Stop</label>
                  <input className={input} value={form.nearestBusStop}
                    onChange={(e) => setForm({ ...form, nearestBusStop: e.target.value })} placeholder="e.g. Myint" />
                </div>
                <div>
                  <label className={label}>Duration (Bus Stop → Home)</label>
                  <input className={input} value={form.durationOfBusStopToHome}
                    onChange={(e) => setForm({ ...form, durationOfBusStopToHome: e.target.value })} placeholder="e.g. 5min" />
                </div>
                <div>
                  <label className={label}>Status (ဝန်ဆောင်မှုအခြေအနေ)</label>
                  <select className={input} value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {PARENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Job / Profession (အလုပ်အကိုင်) - Optional</label>
                  <input className={input} value={form.profession}
                    onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="e.g. Engineer" />
                </div>
              </div>

              {/* Children */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Children</h4>
                  <button type="button" onClick={addChild}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark">
                    <Plus size={14} /> Add Child
                  </button>
                </div>
                <div className="space-y-3">
                  {form.children.map((child, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative">
                      {form.children.length > 1 && (
                        <button type="button" onClick={() => removeChild(i)}
                          className="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-red-500 rounded">
                          <X size={14} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className={label}>Child Name *</label>
                          <input className={input} value={child.childName}
                            onChange={(e) => updateChild(i, 'childName', e.target.value)}
                            placeholder="Child name" />
                        </div>
                        <div>
                          <label className={label}>Age</label>
                          <div className="relative">
                            <input type="number" min="0" className={`${input} pr-16`} value={child.age}
                              onChange={(e) => updateChild(i, 'age', e.target.value ? parseInt(e.target.value) : '')}
                              placeholder="Age" />
                            <button type="button"
                              onClick={() => updateChild(i, 'ageType', child.ageType === 'year' ? 'month' : 'year')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10">
                              {child.ageType === 'year' ? 'Year(s)' : 'Month(s)'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={label}>Gender</label>
                          <select className={input} value={child.gender}
                            onChange={(e) => updateChild(i, 'gender', e.target.value)}>
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="md:col-span-4 flex items-center gap-2 py-1">
                          <input type="checkbox" id={`hasInfectiousDisease-${i}`}
                            checked={child.hasInfectiousDisease}
                            onChange={(e) => updateChild(i, 'hasInfectiousDisease', e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                          <label htmlFor={`hasInfectiousDisease-${i}`} className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                            Has Infectious Disease (ကူးစက်တတ်သောရောဂါ ရှိပါသည်)
                          </label>
                        </div>
                        <div className="md:col-span-4">
                          <label className={label}>Notes</label>
                          <input className={input} value={child.notes}
                            onChange={(e) => updateChild(i, 'notes', e.target.value)}
                            placeholder="Any special notes about this child" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md">
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingId ? 'Update Parent' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parents;
