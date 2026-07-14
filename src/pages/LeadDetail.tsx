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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/leads")}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Lead Detail
            </h1>
            <p className="text-sm text-gray-500">{lead.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.stage === "Bookinged" && leadBookings.length > 0 && (
            <button
              onClick={() => navigate(`/bookings/${leadBookings[0]._id}`)}
              className="inline-flex items-center gap-2 bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-600 transition-all"
            >
              <ExternalLink size={16} /> View Booking (
              {leadBookings[0].bookingNumber})
            </button>
          )}
          {lead.stage !== "Active Customer" &&
            lead.stage !== "Lost" &&
            lead.stage !== "Bookinged" && (
              <button
                onClick={() => handleStageChange("Sale Closed")}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all"
              >
                <CheckCircle size={16} /> Sale Closed
              </button>
            )}
          {lead.stage !== "Active Customer" &&
            lead.stage !== "Lost" &&
            lead.stage !== "Bookinged" && (
              <button
                onClick={() => handleStageChange("Active Customer")}
                className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-purple-600 transition-all"
              >
                <CheckCircle size={16} /> Active Customer
              </button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Lead Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
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
                    });
                    setIsEditing(true);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <Edit2 size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-0.5">
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
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-0.5">
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
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                      Channel
                    </label>
                    <select
                      value={editForm.channel}
                      onChange={(e) =>
                        setEditForm({ ...editForm, channel: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
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
                    <label className="block text-xs font-semibold text-gray-600 mb-0.5">
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
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateMutation.mutate(editForm)}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all py-2.5 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a
                      href={`tel:${lead.phoneNumber}`}
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Phone size={12} />
                      {lead.phoneNumber}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Channel</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                      {channelIcon} {lead.channel}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stage</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${STAGE_COLORS[lead.stage] || "bg-gray-100 text-gray-600"}`}
                    >
                      {lead.stage}
                    </span>
                  </div>
                  {lead.assignedStaffName && (
                    <div>
                      <p className="text-xs text-gray-500">Assigned Staff</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {lead.assignedStaffName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">
                          {lead.assignedStaffName}
                        </span>
                      </div>
                    </div>
                  )}
                  {lead.requirements && (
                    <div>
                      <p className="text-xs text-gray-500">Requirements</p>
                      <p className="text-sm text-gray-700">
                        {lead.requirements}
                      </p>
                    </div>
                  )}
                  {lead.notes && (
                    <div>
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm text-gray-700">{lead.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Created: {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(lead.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stage Change */}
          {!isEditing && lead.stage !== "Bookinged" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                  Change Stage
                </h2>
              </div>
              <div className="p-6">
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                Conversation Logs
              </h2>
            </div>
            <div className="p-6">
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
                          className={`group relative pl-6 pb-4 border-l-2 last:border-l-0 ${log.isDeleted ? "border-gray-200" : "border-primary/20"}`}
                        >
                          <div
                            className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${log.isDeleted ? "bg-gray-200 border-gray-300" : "bg-primary/20 border-primary"}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${log.isDeleted ? "bg-gray-400" : "bg-primary"}`}
                            />
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-900">
                              {log.staffName}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            {log.isEdited && !log.isDeleted && (
                              <span className="text-[10px] text-gray-400 italic">
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
                                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-all"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteLogId(log._id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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
                                className="w-full border border-primary rounded-lg p-2 text-sm focus:ring-primary focus:border-primary"
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
                                  className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingLogId(null);
                                    setEditingNote("");
                                  }}
                                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : log.isDeleted ? (
                            <p className="text-sm text-gray-400 italic flex items-center gap-1">
                              🚫 This message was deleted
                            </p>
                          ) : (
                            <p className="text-sm text-gray-700">{log.note}</p>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No conversation logs yet
                  </div>
                )}
              </div>

              {/* Delete Confirmation Modal */}
              {deleteLogId && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      Delete Message
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      This message will be replaced with "This message was
                      deleted".
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteLogId(null)}
                        className="flex-1 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all py-2.5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteLogMutation.mutate(deleteLogId);
                          setDeleteLogId(null);
                        }}
                        disabled={deleteLogMutation.isPending}
                        className="flex-1 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all py-2.5 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Note Input */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex gap-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1 border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-primary focus:border-primary text-sm"
                    placeholder="Add a note..."
                  />
                  <button
                    onClick={() => {
                      if (newNote.trim()) {
                        logMutation.mutate(newNote);
                      }
                    }}
                    disabled={!newNote.trim() || logMutation.isPending}
                    className="self-end bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
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
