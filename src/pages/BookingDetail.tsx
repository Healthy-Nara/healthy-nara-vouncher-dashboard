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
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  User,
  Edit2,
  Baby,
  Plus,
  Trash2,
  X,
  ClipboardCheck,
  CircleCheckBig,
  XCircle,
  Package,
} from "lucide-react";
import CustomDatePicker, { parseDdMmYyyy } from "../components/CustomDatePicker";

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string }
> = {
  "Pending NA Selection": {
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    icon: "⏳",
  },
  Assigned: { color: "text-blue-700", bg: "bg-blue-100", icon: "🔵" },
  Completed: { color: "text-green-700", bg: "bg-green-100", icon: "✅" },
  Cancelled: { color: "text-red-700", bg: "bg-red-100", icon: "❌" },
};

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(
    null,
  );
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"booking" | "customer">("booking");

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

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({
    childName: "",
    birthDate: "",
    gender: "",
    hasInfectiousDisease: false,
  });
  const [deleteChildIndex, setDeleteChildIndex] = useState<number | null>(null);

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

  const updateBookingMutation = useMutation({
    mutationFn: (data: any) => {
      const toIso = (d: string) => d ? new Date(d.split('-').reverse().join('-')).toISOString() : d;
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

  const [confirmStatus, setConfirmStatus] = useState<
    "Completed" | "Cancelled" | null
  >(null);

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateBookingStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setConfirmStatus(null);
    },
  });

  const startEditParent = () => {
    setParentForm({
      parentName: booking?.parent?.parentName || booking?.customerName || "",
      contactNumber:
        booking?.parent?.contactNumber || booking?.phoneNumber || "",
      township: booking?.parent?.township || "",
      address: booking?.parent?.address || "",
      religion: booking?.parent?.religion || "",
      nearestBusStop: booking?.parent?.nearestBusStop || "",
      durationOfBusStopToHome: booking?.parent?.durationOfBusStopToHome || "",
    });
    setIsEditingParent(true);
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

  const addChildMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate.split('-').reverse().join('-')).toISOString() : data.birthDate,
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

  const loadChildren = async () => {
    if (booking?.bookingToken) {
      try {
        const data = await fetchPublicBookingChildren(booking.bookingToken);
        setChildrenList(data || []);
      } catch {}
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
      return dateStr;
    }
    return format(new Date(dateStr), "dd-MM-yyyy");
  };

  const copyLink = () => {
    if (booking?.bookingToken) {
      const url = `${import.meta.env.VITE_HEALTHY_NARA_API_URL}${booking.bookingToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [copiedDuty, setCopiedDuty] = useState(false);

  const getDutySummaryText = () => {
    if (!booking) return "";
    const lines: string[] = [];
    lines.push("Duty Summary");
    lines.push("============");
    lines.push(
      `Customer: ${booking.parent?.parentName || booking.customerName}`,
    );
    lines.push(
      `Phone: ${booking.parent?.contactNumber || booking.phoneNumber}`,
    );
    if (booking.parent?.address)
      lines.push(`Address: ${booking.parent.address}`);
    if (booking.parent?.nearestBusStop)
      lines.push(`Nearest Bus Stop: ${booking.parent.nearestBusStop}`);
    if (booking.parent?.durationOfBusStopToHome)
      lines.push(
        `Duration (Bus Stop to Home): ${booking.parent.durationOfBusStopToHome}`,
      );
    if (
      Array.isArray(booking.requestedDates) &&
      booking.requestedDates.length > 0
    ) {
      const dates = booking.requestedDates
        .map((d: string) => formatDate(d))
        .join(", ");
      lines.push(`Date/Time: ${dates}`);
    }
    if (booking.dutyType) lines.push(`Duty Type: ${booking.dutyType}`);
    if (booking.dutyShift) lines.push(`Duty Shift: ${booking.dutyShift}`);
    const needs = [booking.requirements, booking.additionalNotes]
      .filter(Boolean)
      .join(", ");
    if (needs) lines.push(`Special Needs: ${needs}`);
    if (booking.caregiverName) lines.push(`NA: ${booking.caregiverName}`);
    return lines.join("\n");
  };

  const dutySummaryText = getDutySummaryText();

  const copyDutySummary = () => {
    navigator.clipboard.writeText(dutySummaryText);
    setCopiedDuty(true);
    setTimeout(() => setCopiedDuty(false), 2000);
  };

  if (isLoading)
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!booking)
    return (
      <div className="text-center py-12 text-gray-500">Booking not found</div>
    );

  const config =
    STATUS_CONFIG[booking.status] || STATUS_CONFIG["Pending NA Selection"];

  return (
    <div className="space-y-0 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/bookings")}
            className="hidden md:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {booking.bookingNumber}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${config.bg} ${config.color}`}
              >
                {config.icon} {booking.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Created {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {booking.status === "Assigned" && !booking.invoice && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount (MMK)"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                className="border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary w-40"
              />
              <button
                onClick={() => {
                  if (invoiceAmount) {
                    invoiceMutation.mutate({ amount: Number(invoiceAmount) });
                  }
                }}
                disabled={!invoiceAmount || invoiceMutation.isPending}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {invoiceMutation.isPending ? "Creating..." : "Generate Invoice"}
              </button>
            </div>
          )}
          {booking.invoice && (
            <button
              onClick={() =>
                navigate(
                  `/invoice/${booking.invoice.invoiceNumber || booking.invoice}`,
                )
              }
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all"
            >
              <ExternalLink size={16} /> View Invoice
            </button>
          )}
          {(booking.status === "Assigned" ||
            booking.status === "Pending NA Selection") && (
            <div className="flex items-center gap-2">
              {booking.status === "Assigned" && (
                <button
                  onClick={() => setConfirmStatus("Completed")}
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-all"
                >
                  <CircleCheckBig size={16} /> Complete
                </button>
              )}
              <button
                onClick={() => setConfirmStatus("Cancelled")}
                className="inline-flex items-center gap-2 border-2 border-red-300 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
              >
                <XCircle size={16} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Header */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
        <button
          onClick={() => setActiveTab("booking")}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
            activeTab === "booking"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Package size={14} className="inline mr-1.5 -mt-0.5" />
          Booking Data
        </button>
        <button
          onClick={() => setActiveTab("customer")}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
            activeTab === "customer"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <User size={14} className="inline mr-1.5 -mt-0.5" />
          Customer Info
        </button>
      </div>

      {/* Booking Data Tab */}
      {activeTab === "booking" && (
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 border-t-0 p-5 space-y-5">
          {/* Service Details (editable) */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <Package size={12} /> Service Details
              </h2>
              {!isEditingBooking && (
                <button
                  onClick={startEditBooking}
                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            <div className="p-5">
              {isEditingBooking ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Service Type
                    </label>
                    <select
                      value={bookingForm.servicePackage}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          servicePackage: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select service type</option>
                      <option value="Newborn Service">Newborn Service</option>
                      <option value="Childcare Service">
                        Childcare Service
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Duty Duration
                    </label>
                    <select
                      value={bookingForm.dutyDuration}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          dutyDuration: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select duration</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Duty Shift
                    </label>
                    <select
                      value={bookingForm.dutyShift}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          dutyShift: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select shift</option>
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Requested Dates
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <CustomDatePicker
                          selected={newDate ? parseDdMmYyyy(newDate) : new Date()}
                          onChange={(date) => setNewDate(format(date, "dd-MM-yyyy"))}
                          minDate={new Date()}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (
                            newDate &&
                            !bookingForm.requestedDates.includes(newDate)
                          ) {
                            setBookingForm((f) => ({
                              ...f,
                              requestedDates: [...f.requestedDates, newDate],
                            }));
                            setNewDate("");
                          }
                        }}
                        disabled={!newDate}
                        className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        Add
                      </button>
                    </div>
                    {bookingForm.requestedDates.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {bookingForm.requestedDates.map((d, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold"
                          >
                            <Calendar size={10} />
                            {formatDate(d)}
                            <button
                              onClick={() =>
                                setBookingForm((f) => ({
                                  ...f,
                                  requestedDates: f.requestedDates.filter(
                                    (_, j) => j !== i,
                                  ),
                                }))
                              }
                              className="p-0.5 hover:bg-primary/20 rounded-full"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        No dates added yet
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Additional Charges
                    </label>
                    {bookingForm.additionalCharges.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        {bookingForm.additionalCharges.map((charge, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={charge.name}
                              onChange={(e) => {
                                const updated = [
                                  ...bookingForm.additionalCharges,
                                ];
                                updated[i] = {
                                  ...updated[i],
                                  name: e.target.value,
                                };
                                setBookingForm({
                                  ...bookingForm,
                                  additionalCharges: updated,
                                });
                              }}
                              placeholder="Charge name"
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            />
                            <input
                              type="number"
                              value={charge.amount || ""}
                              onChange={(e) => {
                                const updated = [
                                  ...bookingForm.additionalCharges,
                                ];
                                updated[i] = {
                                  ...updated[i],
                                  amount: parseFloat(e.target.value) || 0,
                                };
                                setBookingForm({
                                  ...bookingForm,
                                  additionalCharges: updated,
                                });
                              }}
                              placeholder="Amount"
                              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            />
                            <button
                              onClick={() =>
                                setBookingForm({
                                  ...bookingForm,
                                  additionalCharges:
                                    bookingForm.additionalCharges.filter(
                                      (_, j) => j !== i,
                                    ),
                                })
                              }
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 mb-2">
                        No additional charges
                      </p>
                    )}
                    <button
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          additionalCharges: [
                            ...bookingForm.additionalCharges,
                            { name: "", amount: 0 },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={12} /> Add Charge
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      value={bookingForm.additionalNotes}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          additionalNotes: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingBooking(false)}
                      className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        updateBookingMutation.mutate(bookingForm)
                      }
                      disabled={updateBookingMutation.isPending}
                      className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2 disabled:opacity-50"
                    >
                      {updateBookingMutation.isPending
                        ? "Saving..."
                        : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Service Type
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.servicePackage || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Duty Shift
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.dutyShift || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Duty Duration
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.dutyDuration || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Duty Type
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.dutyType || "—"}
                      </p>
                    </div>
                  </div>
                  {booking.requestedDates &&
                    booking.requestedDates.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                          Requested Dates
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {booking.requestedDates.map((d: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold"
                            >
                              <Calendar size={10} />
                              {formatDate(d)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {booking.additionalCharges &&
                    booking.additionalCharges.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                          Additional Charges
                        </p>
                        <div className="space-y-1">
                          {booking.additionalCharges.map(
                            (c: any, i: number) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-700">{c.name}</span>
                                <span className="font-semibold text-gray-900">
                                  {c.amount?.toLocaleString()} MMK
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  {booking.additionalNotes && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Additional Notes
                      </p>
                      <p className="text-sm text-gray-700">
                        {booking.additionalNotes}
                      </p>
                    </div>
                  )}
                  {booking.caregiverName && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase">
                        Assigned NA
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {booking.caregiverName.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {booking.caregiverName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* NA Matching / Assigned */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                {booking.status === "Pending NA Selection"
                  ? "Matching NAs (Available Caregivers)"
                  : "Assigned Caregiver"}
              </h2>
            </div>
            <div className="p-5">
              {booking.status === "Pending NA Selection" ? (
                <>
                  {matchingNAs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No matching caregivers found for the requested dates
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {matchingNAs.map((cg: any) => (
                          <div
                            key={cg._id}
                            onClick={() =>
                              setSelectedCaregiverId(
                                cg._id === selectedCaregiverId ? null : cg._id,
                              )
                            }
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedCaregiverId === cg._id
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {cg.caregiverName?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {cg.caregiverName}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  <span>{cg.gender}</span>
                                  {cg.township && (
                                    <span>· {cg.township}</span>
                                  )}
                                  {cg.specialization && (
                                    <span>· {cg.specialization}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {cg.contactNumber && (
                                <a
                                  href={`tel:${cg.contactNumber}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                >
                                  <Phone size={14} />
                                </a>
                              )}
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedCaregiverId === cg._id
                                    ? "border-primary bg-primary"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedCaregiverId === cg._id && (
                                  <CheckCircle size={12} className="text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedCaregiverId && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() =>
                              assignMutation.mutate(selectedCaregiverId)
                            }
                            disabled={assignMutation.isPending}
                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            {assignMutation.isPending
                              ? "Assigning..."
                              : "Assign Selected NA"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {booking.caregiverName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {booking.caregiverName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assigned to this booking
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Duty Summary for Viber */}
          {booking.status === "Assigned" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardCheck size={12} /> Duty Summary for Viber
                </h2>
                <button
                  onClick={copyDutySummary}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    copiedDuty
                      ? "bg-green-100 text-green-700"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {copiedDuty ? (
                    <>
                      <CheckCircle size={12} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
              <div className="p-4">
                <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed border border-gray-100">
                  {dutySummaryText}
                </pre>
              </div>
            </div>
          )}

          {/* Public Booking Link */}
          {booking.bookingToken &&
            booking.status === "Pending NA Selection" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                    Public Booking Link
                  </h2>
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-2">
                    Customer ကို ဒီ link ပို့ပြီး booking ဖြည့်ခိုင်းနိုင်ပါတယ်
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${import.meta.env.VITE_HEALTHY_NARA_API_URL}${booking.bookingToken}`}
                      className="flex-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={copyLink}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Copy link"
                    >
                      {copied ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Customer Info Tab */}
      {activeTab === "customer" && (
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 border-t-0 p-5 space-y-5">
          {/* Parent Info */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <User size={12} /> Parent Info
              </h2>
              {!isEditingParent && (
                <button
                  onClick={startEditParent}
                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            <div className="p-5">
              {isEditingParent ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Parent Name
                    </label>
                    <input
                      type="text"
                      value={parentForm.parentName}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          parentName: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={parentForm.contactNumber}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          contactNumber: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Township
                    </label>
                    <input
                      type="text"
                      value={parentForm.township}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          township: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Address
                    </label>
                    <textarea
                      rows={2}
                      value={parentForm.address}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          address: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Religion
                    </label>
                    <select
                      value={parentForm.religion}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          religion: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Religion</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Nearest Bus Stop
                    </label>
                    <input
                      type="text"
                      value={parentForm.nearestBusStop}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          nearestBusStop: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                      Duration (Bus Stop to Home)
                    </label>
                    <input
                      type="text"
                      value={parentForm.durationOfBusStopToHome}
                      onChange={(e) =>
                        setParentForm({
                          ...parentForm,
                          durationOfBusStopToHome: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingParent(false)}
                      className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => parentSaveMutation.mutate(parentForm)}
                      disabled={
                        !parentForm.parentName || parentSaveMutation.isPending
                      }
                      className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2 disabled:opacity-50"
                    >
                      {parentSaveMutation.isPending ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {booking.parent?.parentName || booking.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Phone</p>
                    <a
                      href={`tel:${booking.parent?.contactNumber || booking.phoneNumber}`}
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Phone size={12} />{" "}
                      {booking.parent?.contactNumber || booking.phoneNumber}
                    </a>
                  </div>
                  {booking.parent?.township && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Township
                      </p>
                      <p className="text-sm text-gray-900">
                        {booking.parent.township}
                      </p>
                    </div>
                  )}
                  {booking.parent?.address && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Address
                      </p>
                      <p className="text-sm text-gray-700">
                        {booking.parent.address}
                      </p>
                    </div>
                  )}
                  {booking.parent?.religion && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Religion
                      </p>
                      <p className="text-sm text-gray-900">
                        {booking.parent.religion}
                      </p>
                    </div>
                  )}
                  {booking.parent?.nearestBusStop && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Nearest Bus Stop
                      </p>
                      <p className="text-sm text-gray-900">
                        {booking.parent.nearestBusStop}
                      </p>
                    </div>
                  )}
                  {booking.parent?.durationOfBusStopToHome && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Duration (Bus Stop to Home)
                      </p>
                      <p className="text-sm text-gray-900">
                        {booking.parent.durationOfBusStopToHome}
                      </p>
                    </div>
                  )}
                  {booking.lead && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase">
                        Source Lead
                      </p>
                      <button
                        onClick={() =>
                          navigate(
                            `/leads/${booking.lead._id || booking.lead}`,
                          )
                        }
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink size={10} />
                        {booking.lead.customerName || "View Lead"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Children */}
          {booking.bookingToken && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Baby size={12} /> Children
                </h2>
                <button
                  onClick={() => {
                    loadChildren();
                    setShowAddChild(!showAddChild);
                  }}
                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="p-5">
                {childrenList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No children added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {childrenList.map((child: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            <Baby size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {child.childName}
                            </p>
                            <div className="text-[11px] text-gray-500 space-y-0.5 mt-0.5">
                              {child.birthDate && (
                                <p>
                                  📅{" "}
                                  {format(
                                    new Date(child.birthDate),
                                    "dd-MM-yyyy",
                                  )}
                                </p>
                              )}
                              {child.gender && <p>👤 {child.gender}</p>}
                              {child.hasInfectiousDisease && (
                                <p className="text-red-500">
                                  ⚠️ Infectious Disease
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteChildIndex(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddChild && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                        Child Name
                      </label>
                      <input
                        type="text"
                        value={childForm.childName}
                        onChange={(e) =>
                          setChildForm({
                            ...childForm,
                            childName: e.target.value,
                          })
                        }
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                        Birth Date
                      </label>
                      <CustomDatePicker
                        selected={childForm.birthDate ? new Date(childForm.birthDate.split('-').reverse().join('-')) : new Date()}
                        onChange={(date) =>
                          setChildForm({
                            ...childForm,
                            birthDate: format(date, "dd-MM-yyyy"),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                        Gender
                      </label>
                      <select
                        value={childForm.gender}
                        onChange={(e) =>
                          setChildForm({ ...childForm, gender: e.target.value })
                        }
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={childForm.hasInfectiousDisease}
                        onChange={(e) =>
                          setChildForm({
                            ...childForm,
                            hasInfectiousDisease: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <label className="text-xs text-gray-600">
                        Has Infectious Disease
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddChild(false)}
                        className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          addChildMutation.mutate(childForm)
                        }
                        disabled={
                          !childForm.childName.trim() ||
                          addChildMutation.isPending
                        }
                        className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
                      >
                        {addChildMutation.isPending ? "Adding..." : "Add Child"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Confirm Dialog */}
      {confirmStatus && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              {confirmStatus === "Completed" ? (
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <CircleCheckBig size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <XCircle size={24} />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">
                {confirmStatus === "Completed"
                  ? "Mark as Completed?"
                  : "Cancel Booking?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {confirmStatus === "Completed"
                  ? "This booking will be marked as completed."
                  : "This will cancel the booking and free up the caregiver dates."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmStatus(null)}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
              >
                No, Go Back
              </button>
              <button
                onClick={() => statusMutation.mutate(confirmStatus)}
                disabled={statusMutation.isPending}
                className={`flex-1 text-white rounded-xl text-sm font-bold shadow-md transition-all py-2.5 disabled:opacity-50 ${
                  confirmStatus === "Completed"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {statusMutation.isPending
                  ? "Processing..."
                  : `Yes, ${confirmStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Child Confirmation */}
      {deleteChildIndex !== null && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              Remove Child
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove this child?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteChildIndex(null)}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteChildMutation.mutate(deleteChildIndex)}
                disabled={deleteChildMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all py-2.5 disabled:opacity-50"
              >
                {deleteChildMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
