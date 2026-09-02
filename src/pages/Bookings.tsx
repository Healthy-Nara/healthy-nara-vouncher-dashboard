import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBookings, fetchParents, createBookingFromParent, importBookings } from '../api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronRight,
  Calendar,
  Plus,
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Edit2,
  Phone,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useStatsToggle } from '../hooks/useStatsToggle';
import CustomDatePicker from '../components/CustomDatePicker';
import * as XLSX from 'xlsx';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooterBar,
} from '../components/ui/Table';

const ALL_STATUS_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Pending NA Selection', label: 'Pending' },
  { id: 'Assigned', label: 'Active' },
  { id: 'Completed', label: 'History' },
];

export const Bookings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showStats, toggleStats] = useStatsToggle('bookings');
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentForm, setParentForm] = useState({
    servicePackage: '',
    dutyDuration: '',
    dutyShift: '',
    requestedDates: [] as string[],
    additionalNotes: '',
  });
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: any[] } | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (data: any[]) => importBookings(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
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

        const formattedBookings = rows.map((row) => {
          const rawStatus = row['Status'] || row['status'] || 'Pending NA Selection';
          let status = 'Pending NA Selection';
          if (String(rawStatus).toLowerCase() === 'pending') {
            status = 'Completed';
          } else if (String(rawStatus).toLowerCase() === 'assigned') {
            status = 'Assigned';
          } else if (String(rawStatus).toLowerCase() === 'completed') {
            status = 'Completed';
          } else if (String(rawStatus).toLowerCase() === 'cancelled') {
            status = 'Cancelled';
          }

          return {
            bookingId: row['Booking ID'] || row['bookingId'] || undefined,
            parentName: row['Parent Name'] || row['parentName'] || '',
            phoneNumber: String(row['Phone Number'] || row['phoneNumber'] || ''),
            location: row['Location'] || row['location'] || row['Township'] || '',
            address: row['Address'] || row['address'] || '',
            patientType: row['Patient Type'] || row['patientType'] || '',
            servicePackage: row['Service Package'] || row['servicePackage'] || 'Newborn Care Only',
            dutyType: row['Duty Type'] || row['dutyType'] || '',
            requestedDates: row['Requested Dates']
              ? String(row['Requested Dates'])
                  .split(',')
                  .map((d: string) => d.trim())
              : undefined,
            status,
            assignedCaregiverName:
              row['Assigned Caregiver'] || row['Caregiver'] || row['assignedCaregiverName'] || '',
          };
        });

        importMutation.mutate(formattedBookings);
      } catch (err: any) {
        setImportError(`File parse error: ${err.message}`);
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ['bookings'],
    queryFn: () => fetchBookings(),
  });

  const { data: parents = [] } = useQuery<any[]>({
    queryKey: ['parents'],
    queryFn: () => fetchParents(),
    enabled: showParentModal,
  });

  const createFromParentMutation = useMutation({
    mutationFn: (data: any) => createBookingFromParent(data),
    onSuccess: (newBooking: any) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowParentModal(false);
      setSelectedParentId('');
      setParentForm({
        servicePackage: '',
        dutyDuration: '',
        dutyShift: '',
        requestedDates: [],
        additionalNotes: '',
      });
      navigate(`/bookings/${newBooking._id}`);
    },
  });

  const filteredParents = useMemo(() => {
    if (!parentSearch.trim()) return parents;
    const q = parentSearch.toLowerCase();
    return parents.filter(
      (p: any) =>
        p.parentName?.toLowerCase().includes(q) ||
        p.contactNumber?.toLowerCase().includes(q) ||
        p.township?.toLowerCase().includes(q)
    );
  }, [parents, parentSearch]);

  const selectedParent = useMemo(() => {
    return parents.find((p: any) => p._id === selectedParentId);
  }, [parents, selectedParentId]);

  const handleAddDate = () => {
    const isoDate = selectedDateObj.toISOString();
    if (!parentForm.requestedDates.includes(isoDate)) {
      setParentForm((prev) => ({
        ...prev,
        requestedDates: [...prev.requestedDates, isoDate].sort(),
      }));
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setParentForm((prev) => ({
      ...prev,
      requestedDates: prev.requestedDates.filter((d) => d !== dateToRemove),
    }));
  };

  const handleCreateFromParent = () => {
    if (!selectedParentId) return;
    if (parentForm.requestedDates.length === 0) {
      alert('Please add at least one duty date');
      return;
    }
    createFromParentMutation.mutate({
      parentId: selectedParentId,
      ...parentForm,
    });
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: bookings.length,
      'Pending NA Selection': 0,
      Assigned: 0,
      Completed: 0,
      Cancelled: 0,
    };
    bookings.forEach((b: any) => {
      const s = b.status || 'Pending NA Selection';
      if (counts[s] !== undefined) counts[s]++;
      else counts['Pending NA Selection']++;
    });
    return counts;
  }, [bookings]);

  const tabItems = useMemo(() => {
    return ALL_STATUS_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count:
        tab.id === 'All'
          ? bookings.length
          : tab.id === 'Pending NA Selection'
          ? statusCounts['Pending NA Selection'] || 0
          : tab.id === 'Assigned'
          ? statusCounts['Assigned'] || 0
          : statusCounts['Completed'] || 0,
    }));
  }, [bookings, statusCounts]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: any) => {
      const matchesStatus =
        statusFilter === 'All' ||
        booking.status === statusFilter ||
        (statusFilter === 'Pending NA Selection' &&
          (booking.status === 'Pending' || booking.status === 'Pending NA Selection')) ||
        (statusFilter === 'Assigned' &&
          (booking.status === 'Assigned' || booking.status === 'Confirmed'));

      const matchesSearch =
        searchTerm === '' ||
        booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.parent?.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phoneNumber?.includes(searchTerm) ||
        booking.parent?.contactNumber?.includes(searchTerm) ||
        booking.caregiverName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  const formatDateRange = (dates?: string[]) => {
    if (!dates || dates.length === 0) return 'No dates requested';
    if (dates.length === 1) {
      try {
        return format(new Date(dates[0]), 'dd MMM yyyy');
      } catch {
        return dates[0];
      }
    }
    try {
      const sorted = [...dates].sort();
      const first = format(new Date(sorted[0]), 'dd MMM yyyy');
      const last = format(new Date(sorted[sorted.length - 1]), 'dd MMM yyyy');
      return `${first} — ${last} (${dates.length} days)`;
    } catch {
      return `${dates.length} dates`;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Pending NA Selection' || status === 'Pending') {
      return (
        <Badge variant="pending" dot>
          Pending
        </Badge>
      );
    }
    if (status === 'Assigned' || status === 'Confirmed') {
      return (
        <Badge variant="confirmed" dot>
          Confirmed
        </Badge>
      );
    }
    if (status === 'Completed') {
      return (
        <Badge variant="completed" dot>
          Completed
        </Badge>
      );
    }
    if (status === 'Cancelled') {
      return (
        <Badge variant="cancelled" dot>
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="slate" dot>
        {status}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header matching reference image */}
      <div className="shrink-0">
        <PageHeader
          category="SERVICE OPERATIONS"
          title="Bookings"
          subtitle="Manage and track every care appointment in one place."
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
                onClick={toggleStats}
                leftIcon={showStats ? <EyeOff size={14} /> : <Filter size={14} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                title={showStats ? 'Hide filter tabs & search' : 'Show filter tabs & search'}
              >
                {showStats ? 'Hide Filters' : 'Show Filters'}
              </Button>
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
                onClick={() => setShowParentModal(true)}
                leftIcon={<Plus size={16} />}
              >
                New Booking
              </Button>
            </>
          }
        />
      </div>

      {/* Import Status Alert if any */}
      {importError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs shrink-0">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {importResult && (
        <div
          className={`p-4 border rounded-2xl flex items-start gap-3 shrink-0 ${
            importResult.errors.length > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          {importResult.errors.length > 0 ? (
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          ) : (
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          )}
          <div>
            <h4
              className={`text-xs font-bold ${
                importResult.errors.length > 0 ? 'text-amber-900' : 'text-emerald-900'
              }`}
            >
              Import Completed
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Successfully imported <strong>{importResult.successCount}</strong> booking records.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar row (Collapsible) */}
      {showStats && (
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <Tabs
            items={tabItems}
            activeId={statusFilter}
            onChange={(id) => setStatusFilter(id)}
          />

          <div className="w-full md:w-72">
            <SearchInput
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
        </div>
      )}

      {/* Main Table Card matching reference image */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle>All bookings</CardTitle>
            <CardDescription>
              {filteredBookings.length} of {bookings.length} bookings
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<FileSpreadsheet size={14} className="text-teal-600" />}
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(filteredBookings);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
              XLSX.writeFile(wb, `HealthyNara_Bookings_${format(new Date(), 'yyyyMMdd')}.xlsx`);
            }}
          >
            Export list
          </Button>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {bookingsLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
              Loading bookings list...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No bookings match your filter criteria</p>
              <p className="text-xs text-slate-400">
                Try switching tabs or clearing your search keywords.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BOOKING ID</TableHead>
                      <TableHead>CLIENT NAME</TableHead>
                      <TableHead>CAREGIVER</TableHead>
                      <TableHead>SERVICE TYPE</TableHead>
                      <TableHead>DATE & TIME</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking: any) => {
                      const clientName =
                        booking.parent?.parentName || booking.customerName || 'Customer';
                      const caregiverName =
                        booking.caregiverName ||
                        booking.selectedCaregiver?.caregiverName ||
                        '';

                      return (
                        <TableRow
                          key={booking._id}
                          onClick={() => navigate(`/bookings/${booking._id}`)}
                          className="cursor-pointer group"
                        >
                          {/* Booking ID */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs group-hover:text-teal-600 transition-colors">
                              {booking.bookingNumber || `BK-${booking._id.slice(-6).toUpperCase()}`}
                            </span>
                          </TableCell>

                          {/* Client Name with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={clientName} size="sm" />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">
                                  {clientName}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={10} />
                                  <span>{booking.parent?.contactNumber || booking.phoneNumber || '—'}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Caregiver with Avatar */}
                          <TableCell>
                            {caregiverName ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={caregiverName} size="xs" />
                                <span className="font-semibold text-slate-800 text-xs">
                                  {caregiverName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not assigned</span>
                            )}
                          </TableCell>

                          {/* Service Type */}
                          <TableCell>
                            <span className="font-medium text-slate-700 text-xs">
                              {booking.servicePackage || 'Newborn Care'}
                            </span>
                            {booking.dutyType && (
                              <p className="text-[10px] text-slate-400">{booking.dutyType}</p>
                            )}
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell>
                            <p className="font-semibold text-slate-800 text-xs">
                              {formatDateRange(booking.requestedDates)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {booking.dutyDuration || '09:00 — 17:00'}
                            </p>
                          </TableCell>

                          {/* Status */}
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>

                          {/* Amount */}
                          <TableCell>
                            <span className="font-extrabold text-slate-900 font-mono text-xs">
                              {booking.totalAmount
                                ? `${booking.totalAmount.toLocaleString()} MMK`
                                : '—'}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/bookings/${booking._id}`);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-slate-700"
                                title="View details"
                              >
                                <ChevronRight size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/bookings/${booking._id}`);
                                }}
                                className="w-7 h-7 text-slate-400 hover:text-teal-600"
                                title="Edit booking"
                              >
                                <Edit2 size={13} />
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
                {filteredBookings.map((booking: any) => {
                  const clientName =
                    booking.parent?.parentName || booking.customerName || 'Customer';
                  const caregiverName =
                    booking.caregiverName ||
                    booking.selectedCaregiver?.caregiverName ||
                    '';

                  return (
                    <div
                      key={booking._id}
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Top Row: Booking ID & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-xs">
                          {booking.bookingNumber || `BK-${booking._id.slice(-6).toUpperCase()}`}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center gap-2.5">
                        <Avatar name={clientName} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">
                            {clientName}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            <span>{booking.parent?.contactNumber || booking.phoneNumber || '—'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Care Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Package</p>
                          <p className="font-bold text-slate-800 text-[11px]">
                            {booking.servicePackage || 'Newborn Care'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Caregiver</p>
                          <p className="font-bold text-slate-800 text-[11px]">
                            {caregiverName || 'Not assigned'}
                          </p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200/50 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatDateRange(booking.requestedDates)}
                          </span>
                          {booking.totalAmount && (
                            <span className="font-black text-slate-900 font-mono text-xs">
                              {booking.totalAmount.toLocaleString()} MMK
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-xs text-teal-600 font-bold gap-1 pt-0.5">
                        <span>View Booking</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <TableFooterBar
            showingText={`Showing ${filteredBookings.length} of ${bookings.length} entries`}
            updatedText="Last updated just now"
          />
        </CardContent>
      </Card>

      {/* CREATE BOOKING FROM PARENT MODAL */}
      {showParentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Create Booking from Parent
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a registered parent and assign duty shifts
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowParentModal(false)}
                className="w-8 h-8 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Select Parent / Customer
                </label>
                <SearchInput
                  placeholder="Search registered parents..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                />

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl mt-2">
                  {filteredParents.map((p: any) => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedParentId(p._id)}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        selectedParentId === p._id
                          ? 'bg-teal-50 text-teal-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{p.parentName}</p>
                        <p className="text-[11px] text-slate-400">{p.contactNumber} • {p.township}</p>
                      </div>
                      {selectedParentId === p._id && (
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedParent && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/60 text-xs text-teal-900">
                  <p className="font-bold">Selected: {selectedParent.parentName}</p>
                  <p className="text-[11px] text-teal-700">{selectedParent.contactNumber} • {selectedParent.address || selectedParent.township}</p>
                </div>
              )}

              {/* BOOKING DETAILS */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  BOOKING DETAILS
                </p>

                {/* Service Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Service Type
                  </label>
                  <select
                    value={parentForm.servicePackage}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, servicePackage: e.target.value })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select service type</option>
                    <option value="Newborn Service">Newborn Service</option>
                    <option value="Childcare Service">Childcare Service</option>
                  </select>
                </div>

                {/* Duty Duration */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Duty Duration
                  </label>
                  <select
                    value={parentForm.dutyDuration}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, dutyDuration: e.target.value })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select duration</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {/* Duty Shift */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Duty Shift
                  </label>
                  <select
                    value={parentForm.dutyShift}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, dutyShift: e.target.value })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select shift</option>
                    <option value="Day Shift">Day Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                {/* Duty Dates Picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Requested Duty Dates
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <CustomDatePicker
                        selected={selectedDateObj}
                        onChange={(val) => setSelectedDateObj(val)}
                        placeholder="Select Duty Date"
                      />
                    </div>
                    <Button variant="subtle" size="sm" onClick={handleAddDate}>
                      + Add Date
                    </Button>
                  </div>

                  {parentForm.requestedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parentForm.requestedDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold"
                        >
                          {d.slice(0, 10)}
                          <button
                            type="button"
                            onClick={() => handleRemoveDate(d)}
                            className="hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No dates added yet</p>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    value={parentForm.additionalNotes}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, additionalNotes: e.target.value })
                    }
                    placeholder=""
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowParentModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedParentId || parentForm.requestedDates.length === 0 || createFromParentMutation.isPending}
                isLoading={createFromParentMutation.isPending}
                onClick={handleCreateFromParent}
              >
                Create Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
