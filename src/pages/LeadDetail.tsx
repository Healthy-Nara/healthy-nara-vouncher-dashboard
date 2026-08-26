import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeadById,
  updateLead,
  updateLeadStage,
  addConversationLog,
  updateConversationLog,
  deleteConversationLog,
  convertLead,
  fetchBookingsByLead,
} from "../api";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Users,
  Clock,
  Edit2,
  CheckCircle,
  X,
  ExternalLink,
} from "lucide-react";

const STAGES = [
  "New",
  "Contacted",
  "Sale Closed",
  "Bookinged",
  "Active Customer",
  "Lost",
] as const;

const STAGE_COLORS: Record<string, string> = {
  New: "bg-green-100 text-green-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  "Sale Closed": "bg-blue-100 text-blue-700",
  Bookinged: "bg-indigo-100 text-indigo-700",
  "Active Customer": "bg-purple-100 text-purple-700",
  Lost: "bg-red-100 text-red-700",
};

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newNote, setNewNote] = useState("");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLeadById(id!),
    enabled: !!id,
  });

  const { data: leadBookings = [] } = useQuery({
    queryKey: ["leadBookings", id],
    queryFn: () => fetchBookingsByLead(id!),
    enabled: !!id && lead?.stage === "Bookinged",
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLead(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setIsEditing(false);
    },
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) => updateLeadStage(id!, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const logMutation = useMutation({
    mutationFn: (note: string) => addConversationLog(id!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setNewNote("");
    },
  });

  const editLogMutation = useMutation({
    mutationFn: ({ logId, note }: { logId: string; note: string }) =>
      updateConversationLog(id!, logId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setEditingLogId(null);
      setEditingNote("");
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => deleteConversationLog(id!, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (data: any) => convertLead(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/bookings");
    },
  });

  const handleStageChange = (newStage: string) => {
    if (newStage === "Sale Closed" && lead?.stage !== "Sale Closed") {
      convertMutation.mutate({
        servicePackage: lead?.servicePackage || "N/A",
        dutyType: lead?.dutyType || "",
        requestedDates: [],
        requirements: lead?.requirements || "",
      });
      return;
    }
    stageMutation.mutate(newStage);
  };

  if (isLoading)
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!lead)
    return (
      <div className="text-center py-12 text-gray-500">Lead not found</div>
    );

  const channelIcon =
    lead.channel === "Messenger" || lead.channel === "Viber" ? (
      <MessageCircle size={14} />
    ) : lead.channel === "Walk-in" ? (
      <Users size={14} />
    ) : (
      <Phone size={14} />
    );

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/leads")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Leads"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {lead.customerName}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STAGE_COLORS[lead.stage] || "bg-slate-100 text-slate-600"}`}
              >
                {lead.stage}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lead ID: <span className="font-mono text-slate-700">{lead._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lead.stage === "Bookinged" && leadBookings.length > 0 && (
            <button
              onClick={() => navigate(`/bookings/${leadBookings[0]._id}`)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all"
            >
              <ExternalLink size={14} /> View Booking ({leadBookings[0].bookingNumber})
            </button>
          )}
          {lead.stage !== "Active Customer" &&
            lead.stage !== "Lost" &&
            lead.stage !== "Bookinged" && (
              <button
                onClick={() => handleStageChange("Sale Closed")}
                className="inline-flex items-center gap-1.5 bg-[#0d6d5c] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-all"
              >
                <CheckCircle size={14} /> Sale Closed
              </button>
            )}
          {lead.stage !== "Active Customer" &&
            lead.stage !== "Lost" &&
            lead.stage !== "Bookinged" && (
              <button
                onClick={() => handleStageChange("Active Customer")}
                className="inline-flex items-center gap-1.5 bg-purple-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-purple-700 transition-all"
              >
                <CheckCircle size={14} /> Active Customer
              </button>
            )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel - Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Lead Information Card */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Lead Information
              </h2>
              <button
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                  } else {
                    setEditForm({
                      customerName: lead.customerName,
                      phoneNumber: lead.phoneNumber,
                      channel: lead.channel,
                      requirements: lead.requirements || "",
                      notes: lead.notes || "",
                      lostReason: lead.lostReason || "",
                      date: lead.date
                        ? new Date(lead.date).toISOString().slice(0, 10)
                        : "",
                    });
                    setIsEditing(true);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          customerName: e.target.value,
                        })
                      }
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Channel
                    </label>
                    <select
                      value={editForm.channel}
                      onChange={(e) =>
                        setEditForm({ ...editForm, channel: e.target.value })
                      }
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-white"
                    >
                      <option value="Phone">Phone</option>
                      <option value="Messenger">Messenger</option>
                      <option value="Viber">Viber</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-white"
                    >
                    </input>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Requirements
                    </label>
                    <textarea
                      value={editForm.requirements}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          requirements: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      rows={2}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateMutation.mutate(editForm)}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-[#0d6d5c] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-all py-2 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-bold">Name</span>
                    <span className="text-xs font-bold text-slate-900">
                      {lead.customerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-bold">Phone</span>
                    <a
                      href={`tel:${lead.phoneNumber}`}
                      className="text-xs font-bold text-[#0d6d5c] hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <Phone size={11} />
                      {lead.phoneNumber}
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-bold">Channel</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      {channelIcon} {lead.channel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-bold">Stage</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${STAGE_COLORS[lead.stage] || "bg-slate-100 text-slate-600"}`}
                    >
                      {lead.stage}
                    </span>
                  </div>
                  {lead.date && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-xs text-slate-400 font-bold">Date</span>
                      <span className="text-xs font-bold text-slate-900">
                        {new Date(lead.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {lead.assignedStaffName && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-xs text-slate-400 font-bold">Assigned Staff</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0d6d5c] flex items-center justify-center text-[10px] font-bold">
                          {lead.assignedStaffName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {lead.assignedStaffName}
                        </span>
                      </div>
                    </div>
                  )}
                  {lead.requirements && (
                    <div className="py-1 border-b border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">Requirements</span>
                      <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">
                        {lead.requirements}
                      </p>
                    </div>
                  )}
                  {lead.notes && (
                    <div className="py-1 border-b border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">Notes</span>
                      <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-[11px] text-slate-400">
                      Created: {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Updated: {new Date(lead.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stage Change Card */}
          {!isEditing && lead.stage !== "Bookinged" && (
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Change Pipeline Stage
                </h2>
              </div>
              <div className="p-4 sm:p-5">
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 bg-white"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Conversation Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Conversation Logs
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {/* Timeline */}
              <div className="space-y-4 mb-6">
                {lead.conversationLogs && lead.conversationLogs.length > 0 ? (
                  [...lead.conversationLogs]
                    .reverse()
                    .map((log: any, idx: number) => {
                      const originalIndex =
                        lead.conversationLogs.length - 1 - idx;
                      return (
                        <div
                          key={originalIndex}
                          className={`group relative pl-6 pb-4 border-l-2 last:border-l-0 ${log.isDeleted ? "border-slate-200" : "border-teal-300"}`}
                        >
                          <div
                            className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${log.isDeleted ? "bg-slate-200 border-slate-300" : "bg-teal-100 border-[#0d6d5c]"}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${log.isDeleted ? "bg-slate-400" : "bg-[#0d6d5c]"}`}
                            />
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">
                              {log.staffName}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock size={10} />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            {log.isEdited && !log.isDeleted && (
                              <span className="text-[10px] text-slate-400 italic">
                                (edited)
                              </span>
                            )}
                            {!log.isDeleted && (
                              <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingLogId(String(originalIndex));
                                    setEditingNote(log.note);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteLogId(log._id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          {editingLogId === String(originalIndex) ? (
                            <div className="mt-1">
                              <textarea
                                value={editingNote}
                                onChange={(e) => setEditingNote(e.target.value)}
                                rows={2}
                                className="w-full border border-teal-500 rounded-xl p-2 text-xs focus:ring-2 focus:ring-teal-500/20 outline-none"
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() =>
                                    editLogMutation.mutate({
                                      logId: String(originalIndex),
                                      note: editingNote,
                                    })
                                  }
                                  disabled={
                                    !editingNote.trim() ||
                                    editLogMutation.isPending
                                  }
                                  className="px-3 py-1 bg-[#0d6d5c] text-white text-xs font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingLogId(null);
                                    setEditingNote("");
                                  }}
                                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : log.isDeleted ? (
                            <p className="text-xs text-slate-400 italic flex items-center gap-1">
                              🚫 This message was deleted
                            </p>
                          ) : (
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{log.note}</p>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No conversation logs yet
                  </div>
                )}
              </div>

              {/* Delete Confirmation Modal */}
              {deleteLogId && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
                    <h3 className="text-base font-black text-slate-900">
                      Delete Message
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This message will be marked as deleted.
                    </p>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setDeleteLogId(null)}
                        className="flex-1 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all py-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteLogMutation.mutate(deleteLogId);
                          setDeleteLogId(null);
                        }}
                        disabled={deleteLogMutation.isPending}
                        className="flex-1 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all py-2 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Note Input */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:border-[#0d6d5c] focus:ring-2 focus:ring-teal-500/20 outline-none"
                    placeholder="Add a conversation note..."
                  />
                  <button
                    onClick={() => {
                      if (newNote.trim()) {
                        logMutation.mutate(newNote);
                      }
                    }}
                    disabled={!newNote.trim() || logMutation.isPending}
                    className="self-end bg-[#0d6d5c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
