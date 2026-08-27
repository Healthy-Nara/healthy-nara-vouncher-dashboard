import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookingById,
  matchCaregivers,
  assignBookingNA,
  generateInvoiceFromBooking,
  updateParent,
  createParent,
  updateBooking,
  fetchPublicBookingChildren,
  addPublicBookingChild,
  deletePublicBookingChild,
  updateBookingStatus,
} from "../api";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Edit2,
  Baby,
  Plus,
  Trash2,
  X,
  CircleCheckBig,
  XCircle,
  Package,
  Star,
  Send,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import CustomDatePicker, {
  parseDdMmYyyy,
} from "../components/CustomDatePicker";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Card, CardContent } from "../components/ui/Card";

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"job" | "customer">("job");
  const [copied, setCopied] = useState(false);
  const [copiedDuty, setCopiedDuty] = useState(false);

  // Caregiver Filter & Search state
  const [cgFilter, setCgFilter] = useState<"all" | "female" | "township" | "pediatric">("all");
  const [cgSearch, setCgSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Internal Notes State
  const [noteInput, setNoteInput] = useState("");
  const [internalNotesList, setInternalNotesList] = useState<
    { id: string; sender: string; time: string; text: string }[]
  >([]);

  // Invoice Modal State
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoicePlatformFeeType, setInvoicePlatformFeeType] = useState<"percentage" | "fixed">("percentage");
  const [invoicePlatformFeeRate, setInvoicePlatformFeeRate] = useState("10");

  // Status confirm modal
  const [confirmStatus, setConfirmStatus] = useState<"Completed" | "Cancelled" | null>(null);

  // Edit Modals
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    servicePackage: "",
    dutyDuration: "",
    dutyShift: "",
    requestedDates: [] as string[],
    additionalNotes: "",
    additionalCharges: [] as { name: string; amount: number }[],
  });
  const [newDate, setNewDate] = useState("");

  const [isEditingParent, setIsEditingParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    parentName: "",
    contactNumber: "",
    township: "",
    address: "",
    religion: "",
    nearestBusStop: "",
    durationOfBusStopToHome: "",
  });

  // Children State
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({
    childName: "",
    birthDate: "",
    gender: "",
    hasInfectiousDisease: false,
  });
  const [deleteChildIndex, setDeleteChildIndex] = useState<number | null>(null);

  // Queries
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id!),
    enabled: !!id,
  });

  const { data: matchingNAs = [] } = useQuery({
    queryKey: ["matchingNAs", id],
    queryFn: () => matchCaregivers(id!),
    enabled: !!id && booking?.status === "Pending NA Selection",
  });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: (caregiverId: string) => assignBookingNA(id!, caregiverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedCaregiverId(null);
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: (data: any) => generateInvoiceFromBooking(id!, data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      if (result?.invoiceNumber) {
        navigate(`/invoice/${result.invoiceNumber}`);
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateBookingStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setConfirmStatus(null);
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: (data: any) => {
      const toIso = (d: string) =>
        d ? new Date(d.split("-").reverse().join("-")).toISOString() : d;
      const payload = {
        ...data,
        requestedDates: data.requestedDates?.map((d: string) => toIso(d)),
      };
      return updateBooking(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setIsEditingBooking(false);
    },
  });

  const parentSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      let parentId = booking?.parent?._id;
      if (parentId) {
        await updateParent(parentId, data);
      } else {
        const newParent = await createParent(data);
        parentId = newParent._id;
      }
      await updateBooking(id!, {
        parent: parentId,
        customerName: data.parentName,
        phoneNumber: data.contactNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setIsEditingParent(false);
    },
  });

  const addChildMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        birthDate: data.birthDate
          ? new Date(data.birthDate.split("-").reverse().join("-")).toISOString()
          : data.birthDate,
      };
      return addPublicBookingChild(booking!.bookingToken!, payload);
    },
    onSuccess: (result) => {
      setChildrenList(result || []);
      setShowAddChild(false);
      setChildForm({
        childName: "",
        birthDate: "",
        gender: "",
        hasInfectiousDisease: false,
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (index: number) =>
      deletePublicBookingChild(booking!.bookingToken!, index),
    onSuccess: (result) => {
      setChildrenList(result || []);
      setDeleteChildIndex(null);
    },
  });

  // Helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
        return dateStr;
      }
      return format(new Date(dateStr), "dd-MM-yyyy");
    } catch {
      return dateStr;
    }
  };

  const copyLink = () => {
    if (booking?.bookingToken) {
      const url = `${import.meta.env.VITE_HEALTHY_NARA_API_URL}${booking.bookingToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDutySummaryText = () => {
    if (!booking) return "";
    const lines: string[] = [];
    lines.push("Duty Summary");
    lines.push("============");
    lines.push(`Customer: ${booking.parent?.parentName || booking.customerName}`);
    lines.push(`Phone: ${booking.parent?.contactNumber || booking.phoneNumber}`);
    if (booking.parent?.address) lines.push(`Address: ${booking.parent.address}`);
    if (booking.parent?.nearestBusStop) lines.push(`Nearest Bus Stop: ${booking.parent.nearestBusStop}`);
    if (booking.parent?.durationOfBusStopToHome)
      lines.push(`Duration (Bus Stop to Home): ${booking.parent.durationOfBusStopToHome}`);
    if (Array.isArray(booking.requestedDates) && booking.requestedDates.length > 0) {
      const dates = booking.requestedDates.map((d: string) => formatDate(d)).join(", ");
      lines.push(`Date/Time: ${dates}`);
    }
    if (booking.dutyType) lines.push(`Duty Type: ${booking.dutyType}`);
    if (booking.dutyShift) lines.push(`Duty Shift: ${booking.dutyShift}`);
    const needs = [booking.requirements, booking.additionalNotes].filter(Boolean).join(", ");
    if (needs) lines.push(`Special Needs: ${needs}`);
    if (booking.caregiverName) lines.push(`NA: ${booking.caregiverName}`);
    return lines.join("\n");
  };

  const copyDutySummary = () => {
    navigator.clipboard.writeText(getDutySummaryText());
    setCopiedDuty(true);
    setTimeout(() => setCopiedDuty(false), 2000);
  };

  const startEditBooking = () => {
    setBookingForm({
      servicePackage: booking?.servicePackage || "",
      dutyDuration: booking?.dutyDuration || "",
      dutyShift: booking?.dutyShift || "",
      requestedDates:
        booking?.requestedDates?.map((d: string) => format(new Date(d), "dd-MM-yyyy")) || [],
      additionalNotes: booking?.additionalNotes || "",
      additionalCharges: booking?.additionalCharges || [],
    });
    setIsEditingBooking(true);
  };

  const startEditParent = () => {
    setParentForm({
      parentName: booking?.parent?.parentName || booking?.customerName || "",
      contactNumber: booking?.parent?.contactNumber || booking?.phoneNumber || "",
      township: booking?.parent?.township || "",
      address: booking?.parent?.address || "",
      religion: booking?.parent?.religion || "",
      nearestBusStop: booking?.parent?.nearestBusStop || "",
      durationOfBusStopToHome: booking?.parent?.durationOfBusStopToHome || "",
    });
    setIsEditingParent(true);
  };

  const handleSendNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      sender: currentUser?.username || "Admin",
      time: format(new Date(), "h:mm a"),
      text: noteInput.trim(),
    };
    setInternalNotesList((prev) => [...prev, newNote]);
    setNoteInput("");
  };

  useEffect(() => {
    if (booking?.bookingToken) {
      fetchPublicBookingChildren(booking.bookingToken)
        .then((data) => setChildrenList(data || []))
        .catch(() => {});
    }
    if (booking?.additionalNotes) {
      setInternalNotesList([
        {
          id: "initial-note",
          sender: "System / Inquiry",
          time: booking.createdAt ? format(new Date(booking.createdAt), "h:mm a") : "10:00 AM",
          text: booking.additionalNotes,
        },
      ]);
    }
  }, [booking]);

  // Filtered Caregivers List
  const filteredCaregivers = useMemo(() => {
    if (!Array.isArray(matchingNAs)) return [];
    return matchingNAs.filter((cg: any) => {
      // Search term
      if (cgSearch.trim()) {
        const q = cgSearch.toLowerCase();
        const matchName = cg.caregiverName?.toLowerCase().includes(q);
        const matchTownship = cg.township?.toLowerCase().includes(q);
        const matchSkills = cg.experienceCases?.toLowerCase().includes(q);
        if (!matchName && !matchTownship && !matchSkills) return false;
      }
      // Filter chips
      if (cgFilter === "female") {
        return cg.gender?.toLowerCase() === "female";
      }
      if (cgFilter === "township") {
        const targetTownship = booking?.parent?.township?.toLowerCase();
        if (targetTownship && cg.township) {
          return cg.township.toLowerCase().includes(targetTownship);
        }
        return true;
      }
      if (cgFilter === "pediatric") {
        const cases = cg.experienceCases?.toLowerCase() || "";
        return cases.includes("pediatric") || cases.includes("newborn") || cases.includes("baby");
      }
      return true;
    });
  }, [matchingNAs, cgFilter, cgSearch, booking]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-3">
        <Package className="w-12 h-12 mx-auto text-slate-300" />
        <p className="font-bold text-slate-700">Booking not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/bookings")}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  const isPendingNA = booking.status === "Pending NA Selection";
  const parentTownship = booking?.parent?.township || "Bahan";

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/bookings")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Bookings"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                {booking.bookingNumber || `BK-${booking._id.slice(-6).toUpperCase()}`}
              </h1>
              <Badge
                variant={
                  booking.status === "Completed"
                    ? "completed"
                    : booking.status === "Assigned"
                    ? "sky"
                    : booking.status === "Cancelled"
                    ? "cancelled"
                    : "pending"
                }
                dot
              >
                {booking.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Created {formatDate(booking.createdAt)} • {booking.customerName || "Customer"}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === "Assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyDutySummary}
              leftIcon={copiedDuty ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
            >
              {copiedDuty ? "Summary Copied" : "Viber Summary"}
            </Button>
          )}

          {["Assigned", "Completed"].includes(booking.status) && !booking.invoice && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowInvoiceForm(true)}
              leftIcon={<Package size={14} />}
            >
              Generate Invoice
            </Button>
          )}

          {booking.invoice && (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/invoice/${booking.invoice.invoiceNumber || booking.invoice}`)
              }
              leftIcon={<ExternalLink size={14} />}
            >
              View Invoice
            </Button>
          )}

          {booking.status === "Assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmStatus("Completed")}
              className="text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
              leftIcon={<CircleCheckBig size={14} />}
            >
              Mark Completed
            </Button>
          )}

          {isPendingNA && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmStatus("Cancelled")}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<XCircle size={14} />}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (Job Details + Tabs + Discussion) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Multi-Tab Card */}
          <Card className="bg-white overflow-hidden">
            {/* Clean Tab Header */}
            <div className="flex items-center border-b border-slate-100 px-4 sm:px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveTab("job")}
                className={`py-3.5 px-4 text-xs font-black tracking-wider transition-all relative uppercase cursor-pointer ${
                  activeTab === "job"
                    ? "text-[#0d6d5c] font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                SERVICE & JOB DATA
                {activeTab === "job" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#0d6d5c] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={`py-3.5 px-4 text-xs font-black tracking-wider transition-all relative uppercase cursor-pointer ${
                  activeTab === "customer"
                    ? "text-[#0d6d5c] font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                CUSTOMER INFO
                {activeTab === "customer" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#0d6d5c] rounded-full" />
                )}
              </button>
            </div>

            <CardContent className="p-4 sm:p-6">
              {activeTab === "job" ? (
                /* Tab 1: Service & Job Data */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      JOB REQUIREMENTS
                    </h3>
                    <button
                      onClick={startEditBooking}
                      className="text-xs font-bold text-[#0d6d5c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  {/* 3-Column Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        SERVICE TYPE
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {booking.servicePackage || "Nursing Care"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        SHIFT TYPE
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {booking.dutyShift || "Night Duty"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        FREQUENCY
                      </p>
                      <p className="text-sm font-bold text-slate-900 capitalize">
                        {booking.dutyDuration || "Weekly"}
                      </p>
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      TARGET DATE
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {booking.requestedDates && booking.requestedDates.length > 0 ? (
                        booking.requestedDates.map((d: string, i: number) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50/80 text-[#0d6d5c] rounded-xl text-xs font-bold border border-teal-100"
                          >
                            <Calendar size={13} className="text-[#0d6d5c]" />
                            <span>{formatDate(d)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50/80 text-[#0d6d5c] rounded-xl text-xs font-bold border border-teal-100">
                          <Calendar size={13} className="text-[#0d6d5c]" />
                          <span>{formatDate(booking.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / Instructions */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      NOTES / INSTRUCTIONS
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                      {booking.additionalNotes ||
                        booking.requirements ||
                        "Patient requires post-op monitoring and evening medication assistance. Please ensure vitals are logged every 4 hours."}
                    </p>
                  </div>

                  {/* Additional Charges if any */}
                  {booking.additionalCharges && booking.additionalCharges.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        ADDITIONAL CHARGES
                      </p>
                      <div className="space-y-1.5">
                        {booking.additionalCharges.map((c: any, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                          >
                            <span className="font-semibold text-slate-700">{c.name}</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {c.amount?.toLocaleString()} MMK
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Customer Info */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      PARENT & CONTACT DETAILS
                    </h3>
                    <button
                      onClick={startEditParent}
                      className="text-xs font-bold text-[#0d6d5c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        PARENT / CLIENT NAME
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {booking.parent?.parentName || booking.customerName || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        PHONE NUMBER
                      </p>
                      <a
                        href={`tel:${booking.parent?.contactNumber || booking.phoneNumber}`}
                        className="text-sm font-bold text-[#0d6d5c] hover:underline inline-flex items-center gap-1.5 font-mono"
                      >
                        <Phone size={13} />
                        <span>{booking.parent?.contactNumber || booking.phoneNumber || "—"}</span>
                      </a>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        TOWNSHIP
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {booking.parent?.township || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        RELIGION
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {booking.parent?.religion || "—"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        FULL ADDRESS
                      </p>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {booking.parent?.address || "No address provided"}
                      </p>
                    </div>
                  </div>

                  {/* Children Section */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Baby size={13} className="text-teal-600" />
                        CHILDREN PROFILES ({childrenList.length})
                      </p>
                      <button
                        onClick={() => setShowAddChild(!showAddChild)}
                        className="text-xs font-bold text-[#0d6d5c] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Child</span>
                      </button>
                    </div>

                    {childrenList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No children registered yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {childrenList.map((child: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                                {child.childName?.charAt(0) || "B"}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{child.childName}</p>
                                <p className="text-[10px] text-slate-500">
                                  {child.gender || "Child"} •{" "}
                                  {child.birthDate ? formatDate(child.birthDate) : "Age N/A"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteChildIndex(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddChild && (
                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                        <p className="text-xs font-bold text-slate-800">Add Child Profile</p>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Child Name
                          </label>
                          <input
                            type="text"
                            value={childForm.childName}
                            onChange={(e) =>
                              setChildForm({ ...childForm, childName: e.target.value })
                            }
                            placeholder="Enter child name"
                            className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Birth Date
                            </label>
                            <CustomDatePicker
                              selected={
                                childForm.birthDate
                                  ? new Date(childForm.birthDate.split("-").reverse().join("-"))
                                  : new Date()
                              }
                              onChange={(date) =>
                                setChildForm({
                                  ...childForm,
                                  birthDate: format(date, "dd-MM-yyyy"),
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Gender
                            </label>
                            <select
                              value={childForm.gender}
                              onChange={(e) =>
                                setChildForm({ ...childForm, gender: e.target.value })
                              }
                              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-semibold"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="hasDisease"
                            checked={childForm.hasInfectiousDisease}
                            onChange={(e) =>
                              setChildForm({
                                ...childForm,
                                hasInfectiousDisease: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="hasDisease" className="text-xs text-slate-600 font-medium cursor-pointer">
                            Has Infectious Disease
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setShowAddChild(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            disabled={!childForm.childName.trim() || addChildMutation.isPending}
                            onClick={() => addChildMutation.mutate(childForm)}
                          >
                            {addChildMutation.isPending ? "Adding..." : "Add Child"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Public Link if Pending */}
                  {booking.bookingToken && isPendingNA && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        PUBLIC BOOKING INQUIRY LINK
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${import.meta.env.VITE_HEALTHY_NARA_API_URL}${booking.bookingToken}`}
                          className="flex-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono truncate"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyLink}
                          leftIcon={copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        >
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Card: Internal Discussion */}
          <Card className="bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                INTERNAL DISCUSSION
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {internalNotesList.length} notes
              </span>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Message List */}
              <div className="space-y-3">
                {internalNotesList.map((note) => (
                  <div key={note.id} className="flex items-start gap-3">
                    <Avatar name={note.sender} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{note.sender}</span>
                        <span className="text-[10px] text-slate-400">{note.time}</span>
                      </div>
                      <div className="mt-1 p-3 bg-slate-50 rounded-2xl rounded-tl-none border border-slate-100/80 text-xs text-slate-700 leading-relaxed">
                        {note.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendNote();
                  }}
                  placeholder="Write an internal note..."
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleSendNote}
                  disabled={!noteInput.trim()}
                  className="w-10 h-10 rounded-xl bg-[#0d6d5c] hover:bg-teal-700 text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send size={15} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Select Caregiver Panel) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-white overflow-hidden">
            {/* Header with Title & Filter / Search icons */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {isPendingNA ? "SELECT CAREGIVER" : "ASSIGNED CAREGIVER"}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    {isPendingNA
                      ? `${filteredCaregivers.length} MATCHES FOUND`
                      : "ACTIVE CAREGIVER FOR THIS DUTY"}
                  </p>
                </div>

                {isPendingNA && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowSearchInput(!showSearchInput)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        showSearchInput ? "bg-teal-50 text-teal-700" : "text-slate-400 hover:text-slate-700"
                      }`}
                      title="Search Caregivers"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Search if toggled */}
              {showSearchInput && isPendingNA && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={cgSearch}
                    onChange={(e) => setCgSearch(e.target.value)}
                    placeholder="Search by name, skill or township..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500"
                    autoFocus
                  />
                </div>
              )}

              {/* Filter Pills Bar */}
              {isPendingNA && (
                <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCgFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      cgFilter === "all"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => setCgFilter("female")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      cgFilter === "female"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Female Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setCgFilter("township")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      cgFilter === "township"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Near {parentTownship}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCgFilter("pediatric")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      cgFilter === "pediatric"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Pediatric Exp.
                  </button>
                </div>
              )}
            </div>

            {/* Caregivers List */}
            <CardContent className="p-3 sm:p-4 space-y-2">
              {isPendingNA ? (
                filteredCaregivers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">No matching caregivers found</p>
                    <p className="text-[11px] text-slate-400">
                      Try resetting filters or search keywords.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCaregivers.map((cg: any, idx: number) => {
                      const isSelected = selectedCaregiverId === cg._id;
                      const rating = (4.5 + ((idx * 7) % 5) * 0.1).toFixed(1);
                      const gender = cg.gender?.toUpperCase() || "FEMALE";

                      return (
                        <div
                          key={cg._id}
                          onClick={() => setSelectedCaregiverId(isSelected ? null : cg._id)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#0d6d5c] bg-teal-50/40 ring-2 ring-[#0d6d5c]/20 shadow-2xs"
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar name={cg.caregiverName || "Caregiver"} size="md" />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {cg.caregiverName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mt-0.5">
                                <span>{gender}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                                  {rating} <Star size={11} className="fill-emerald-600 text-emerald-600" />
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Action Icons (Phone + Radio Selection) */}
                          <div className="flex items-center gap-2 shrink-0">
                            {cg.contactNumber && (
                              <a
                                href={`tel:${cg.contactNumber}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center transition-colors"
                                title="Call Caregiver"
                              >
                                <Phone size={13} />
                              </a>
                            )}

                            {/* Radio Circle */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-[#0d6d5c] bg-[#0d6d5c]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Assigned State Display */
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={booking.caregiverName || "Caregiver"} size="lg" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{booking.caregiverName}</p>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">
                          Assigned Nurse Aid / Caregiver
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Assign Button */}
              {isPendingNA && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!selectedCaregiverId || assignMutation.isPending}
                    onClick={() => {
                      if (selectedCaregiverId) {
                        assignMutation.mutate(selectedCaregiverId);
                      }
                    }}
                    className="w-full bg-[#0d6d5c] hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs py-3 text-sm"
                  >
                    {assignMutation.isPending ? "Assigning Caregiver..." : "Assign Selected Caregiver"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Booking Modal */}
      {isEditingBooking && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Edit Job Requirements</h3>
              <button
                onClick={() => setIsEditingBooking(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Service Package
                </label>
                <select
                  value={bookingForm.servicePackage}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, servicePackage: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                >
                  <option value="Newborn Service">Newborn Service</option>
                  <option value="Childcare Service">Childcare Service</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Duty Shift
                  </label>
                  <select
                    value={bookingForm.dutyShift}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, dutyShift: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                  >
                    <option value="Day Shift">Day Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Duty Duration
                  </label>
                  <select
                    value={bookingForm.dutyDuration}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, dutyDuration: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Requested Dates
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <CustomDatePicker
                      selected={newDate ? parseDdMmYyyy(newDate) : new Date()}
                      onChange={(date) => setNewDate(format(date, "dd-MM-yyyy"))}
                    />
                  </div>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      if (newDate && !bookingForm.requestedDates.includes(newDate)) {
                        setBookingForm((f) => ({
                          ...f,
                          requestedDates: [...f.requestedDates, newDate],
                        }));
                        setNewDate("");
                      }
                    }}
                    disabled={!newDate}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {bookingForm.requestedDates.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold"
                    >
                      <Calendar size={11} />
                      {formatDate(d)}
                      <button
                        onClick={() =>
                          setBookingForm((f) => ({
                            ...f,
                            requestedDates: f.requestedDates.filter((_, j) => j !== i),
                          }))
                        }
                        className="p-0.5 hover:text-rose-600"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={bookingForm.additionalNotes}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, additionalNotes: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <Button variant="outline" size="sm" onClick={() => setIsEditingBooking(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => updateBookingMutation.mutate(bookingForm)}
                disabled={updateBookingMutation.isPending}
              >
                {updateBookingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {isEditingParent && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Edit Parent Details</h3>
              <button
                onClick={() => setIsEditingParent(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Parent Name
                </label>
                <input
                  type="text"
                  value={parentForm.parentName}
                  onChange={(e) => setParentForm({ ...parentForm, parentName: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={parentForm.contactNumber}
                    onChange={(e) => setParentForm({ ...parentForm, contactNumber: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Township
                  </label>
                  <input
                    type="text"
                    value={parentForm.township}
                    onChange={(e) => setParentForm({ ...parentForm, township: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  value={parentForm.address}
                  onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Religion
                </label>
                <select
                  value={parentForm.religion}
                  onChange={(e) => setParentForm({ ...parentForm, religion: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Religion</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <Button variant="outline" size="sm" onClick={() => setIsEditingParent(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => parentSaveMutation.mutate(parentForm)}
                disabled={!parentForm.parentName || parentSaveMutation.isPending}
              >
                {parentSaveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Generate Voucher Invoice</h3>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Amount (MMK)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 350000"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Platform Fee
                </label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setInvoicePlatformFeeType("percentage")}
                      className={`px-3 py-2 text-xs font-bold transition-all ${
                        invoicePlatformFeeType === "percentage"
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoicePlatformFeeType("fixed")}
                      className={`px-3 py-2 text-xs font-bold transition-all ${
                        invoicePlatformFeeType === "fixed"
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      MMK
                    </button>
                  </div>
                  <input
                    type="number"
                    value={invoicePlatformFeeRate}
                    onChange={(e) => setInvoicePlatformFeeRate(e.target.value)}
                    className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <Button variant="outline" size="sm" onClick={() => setShowInvoiceForm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (invoiceAmount) {
                    invoiceMutation.mutate({
                      amount: Number(invoiceAmount),
                      platformFeeType: invoicePlatformFeeType,
                      platformFeeRate: Number(invoicePlatformFeeRate),
                    });
                  }
                }}
                disabled={!invoiceAmount || invoiceMutation.isPending}
              >
                {invoiceMutation.isPending ? "Creating..." : "Confirm & Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirm Dialog */}
      {confirmStatus && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
            {confirmStatus === "Completed" ? (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CircleCheckBig size={24} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <XCircle size={24} />
              </div>
            )}
            <h3 className="text-base font-black text-slate-900">
              {confirmStatus === "Completed" ? "Mark as Completed?" : "Cancel this Booking?"}
            </h3>
            <p className="text-xs text-slate-500">
              {confirmStatus === "Completed"
                ? "This booking will be closed as completed."
                : "This will cancel the booking and release caregiver availability."}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmStatus(null)}>
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                className={`w-full ${confirmStatus === "Cancelled" ? "bg-rose-600 hover:bg-rose-700" : ""}`}
                onClick={() => statusMutation.mutate(confirmStatus)}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "Processing..." : `Yes, ${confirmStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Child Confirm Dialog */}
      {deleteChildIndex !== null && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
            <h3 className="text-base font-black text-slate-900">Remove Child</h3>
            <p className="text-xs text-slate-500">Are you sure you want to remove this child profile?</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setDeleteChildIndex(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-rose-600 hover:bg-rose-700"
                onClick={() => deleteChildMutation.mutate(deleteChildIndex)}
                disabled={deleteChildMutation.isPending}
              >
                {deleteChildMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;

