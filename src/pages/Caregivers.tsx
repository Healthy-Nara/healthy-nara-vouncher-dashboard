import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCaregivers, createCaregiver, updateCaregiver, deleteCaregiver } from '../api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, X, Eye } from 'lucide-react';

const GENDERS = ['Male', 'Female'] as const;

interface CaregiverForm {
  caregiverName: string;
  contactNumber: string;
  gender: string;
  township: string;
  NRC: string;
  address: string;
  birthdate: string;
  bankInfo: string;
  specialization: string;
  note: string;
}

const emptyForm = (): CaregiverForm => ({
  caregiverName: '', contactNumber: '', gender: 'Female',
  township: '', NRC: '', address: '', birthdate: '',
  bankInfo: '', specialization: '', note: '',
});

const Caregivers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CaregiverForm>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: caregivers, isLoading } = useQuery({
    queryKey: ['caregivers'],
    queryFn: fetchCaregivers,
  });

  const createMutation = useMutation({
    mutationFn: (data: CaregiverForm) => createCaregiver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
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
    setForm({
      caregiverName: c.caregiverName || '',
      contactNumber: c.contactNumber || '',
      gender: c.gender || 'Female',
      township: c.township || '',
      NRC: c.NRC || '',
      address: c.address || '',
      birthdate: c.birthdate ? new Date(c.birthdate).toISOString().split('T')[0] : '',
      bankInfo: c.bankInfo || '',
      specialization: c.specialization || '',
      note: c.note || '',
    });
    setEditingId(c._id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = caregivers?.filter((c: any) =>
    c.caregiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactNumber?.includes(searchTerm) ||
    c.township?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const input = 'mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm';
  const label = 'block text-xs font-semibold text-gray-600 mb-0.5';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Caregiver Directory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your network of professional caregivers.</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all gap-2">
          <Plus size={18} /> Add Caregiver
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search caregivers..."
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 focus:ring-primary focus:border-primary sm:text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Gender</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Township</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">NRC</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">No caregivers found.</td></tr>
              ) : (
                filtered?.map((c: any) => (
                  <tr key={c._id} onClick={() => navigate(`/caregivers/${c._id}`)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{c.caregiverName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.contactNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary capitalize">
                        {c.gender || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.township || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.NRC || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/caregivers/${c._id}`); }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c._id); }}
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Caregiver?</h3>
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
                {editingId ? 'Edit Caregiver' : 'Add New Caregiver'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Caregiver Name *</label>
                  <input required className={input} value={form.caregiverName}
                    onChange={(e) => setForm({ ...form, caregiverName: e.target.value })} placeholder="e.g. Hello" />
                </div>
                <div>
                  <label className={label}>Contact Number *</label>
                  <input required className={input} value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="e.g. 0934534" />
                </div>
                <div>
                  <label className={label}>Gender</label>
                  <select className={input} value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Township</label>
                  <input className={input} value={form.township}
                    onChange={(e) => setForm({ ...form, township: e.target.value })} placeholder="e.g. YGN" />
                </div>
                <div>
                  <label className={label}>NRC</label>
                  <input className={input} value={form.NRC}
                    onChange={(e) => setForm({ ...form, NRC: e.target.value })} placeholder="NRC number" />
                </div>
                <div>
                  <label className={label}>Birthdate</label>
                  <input type="date" className={input} value={form.birthdate}
                    onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className={label}>Address</label>
                  <input className={input} value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div>
                  <label className={label}>Bank Info (optional)</label>
                  <input className={input} value={form.bankInfo}
                    onChange={(e) => setForm({ ...form, bankInfo: e.target.value })} placeholder="Bank account details" />
                </div>
                <div>
                  <label className={label}>Specialization (optional)</label>
                  <input className={input} value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Newborn Care" />
                </div>
                <div>
                  <label className={label}>Note (optional)</label>
                  <input className={input} value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Any additional notes" />
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
                    : editingId ? 'Update Caregiver' : 'Create Caregiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caregivers;
