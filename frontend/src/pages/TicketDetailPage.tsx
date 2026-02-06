import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Ticket = {
  id: string;
  equipment_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  reported_by_user_id?: string | null;
  assigned_to_user_id?: string | null;
};

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  department_id?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  status?: string;
};

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const auth = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editStatus, setEditStatus] = useState("open");
  
  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string>("");

  useEffect(() => {
    loadTicket();
    loadTechnicians();
  }, [id]);

  const loadTechnicians = async () => {
    try {
      // Fetch all users and filter for techs
      const users = await apiFetch<User[]>("/auth/users");
      const techs = users.filter(u => u.role === "tech");
      setTechnicians(techs);
    } catch (e: any) {
      console.error("Failed to load technicians:", e);
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Ticket>(`/tickets/${id}`);
      setTicket(data);
      setEditTitle(data.title);
      setEditDescription(data.description || "");
      setEditPriority(data.priority || "medium");
      setEditStatus(data.status);
      setSelectedTechId(data.assigned_to_user_id || "");

      // Load equipment details
      if (data.equipment_id) {
        const equipmentData = await apiFetch<Equipment>(`/equipment/${data.equipment_id}`);
        setEquipment(equipmentData);
        
        // Load department details if equipment has a department
        if (equipmentData.department_id) {
          const departmentData = await apiFetch<Department>(`/departments/${equipmentData.department_id}`);
          setDepartment(departmentData);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return;
    
    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadTicket();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!ticket) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          priority: editPriority,
          status: editStatus,
        }),
      });
      setIsEditing(false);
      await loadTicket();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!ticket || !selectedTechId) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_to_user_id: selectedTechId,
        }),
      });
      setShowAssignModal(false);
      await loadTicket();
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign ticket");
    } finally {
      setUpdating(false);
    }
  };

  const getAssignedTechName = () => {
    if (!ticket?.assigned_to_user_id) return "Unassigned";
    const tech = technicians.find(t => t.id === ticket.assigned_to_user_id);
    return tech ? tech.full_name : "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-orange-100 text-orange-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <button onClick={() => nav("/tickets")} className="mt-4 btn-secondary">
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => nav("/tickets")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tickets
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
          >
            {isEditing ? "Cancel Edit" : "Edit Ticket"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Ticket Details */}
        <div className="card mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    {/* Viewers cannot set to resolved or closed */}
                    {!auth.isViewer() && <option value="resolved">Resolved</option>}
                    {auth.canCloseTickets() && <option value="closed">Closed</option>}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="btn-primary"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    {ticket.priority && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {ticket.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Equipment Info */}
        {equipment && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment</h2>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-lg">{equipment.device_name}</p>
                  <p className="text-sm text-gray-500 mt-1">Asset: {equipment.asset_tag}</p>
                  
                  {/* Department */}
                  {department && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Department: </span>
                      <span className="text-sm font-medium text-gray-900">{department.name}</span>
                    </div>
                  )}
                  
                  {/* Manufacturer */}
                  {equipment.manufacturer && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">Manufacturer: </span>
                      <span className="text-sm text-gray-700">{equipment.manufacturer}</span>
                    </div>
                  )}
                  
                  {/* Model */}
                  {equipment.model && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">Model: </span>
                      <span className="text-sm text-gray-700">{equipment.model}</span>
                    </div>
                  )}
                  
                  {/* Status */}
                  {equipment.status && (
                    <div className="mt-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        equipment.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : equipment.status === 'out_of_service'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {equipment.status.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => nav(`/equipment`)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Equipment</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Info */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assignment</h2>
            {/* Only supervisors and super_admins can assign tickets */}
            {auth.isSupervisorOrAbove() && !isEditing && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {ticket?.assigned_to_user_id ? "Reassign" : "Assign Ticket"}
              </button>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Assigned to</p>
            <p className="font-medium text-gray-900 mt-1">{getAssignedTechName()}</p>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Ticket to Technician</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Technician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleAssignTicket}
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? "Assigning..." : "Assign"}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTechId(ticket?.assigned_to_user_id || "");
                  }}
                  disabled={updating}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Actions */}
        {!isEditing && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleUpdateStatus("open")}
                disabled={updating || ticket.status === "open"}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ticket.status === "open"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Mark as Open
              </button>
              <button
                onClick={() => handleUpdateStatus("in_progress")}
                disabled={updating || ticket.status === "in_progress"}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ticket.status === "in_progress"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                In Progress
              </button>
              {/* Viewers cannot resolve tickets */}
              {!auth.isViewer() && (
                <button
                  onClick={() => handleUpdateStatus("resolved")}
                  disabled={updating || ticket.status === "resolved"}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    ticket.status === "resolved"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  Resolve
                </button>
              )}
              {/* Only supervisors and super_admins can close tickets */}
              {auth.canCloseTickets() && (
                <button
                  onClick={() => handleUpdateStatus("closed")}
                  disabled={updating || ticket.status === "closed"}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    ticket.status === "closed"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
