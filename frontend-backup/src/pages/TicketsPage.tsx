import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../lib/api";
import { showError, showSuccess } from "../lib/notifications";

type Ticket = {
  id: string;
  equipment_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  created_at: string;
};

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
};

type PaginatedResponse = {
  items: Ticket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function TicketsPage() {
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // View mode state - load from user preferences
  const [viewMode, setViewMode] = useState<"table" | "horizontal" | "grid">(() => {
    // Try to load from user preferences in localStorage
    const savedPrefs = localStorage.getItem("userPreferences");
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        return prefs.default_view_mode || "horizontal";
      } catch {
        return "horizontal";
      }
    }
    return "horizontal";
  });
  
  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Quick status update modal state
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [quickStatusTicket, setQuickStatusTicket] = useState<Ticket | null>(null);
  const [quickStatus, setQuickStatus] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());
      
      const queryString = params.toString();
      const url = `/tickets/?${queryString}`;
      
      const data = await apiFetch<PaginatedResponse>(url);
      setTickets(data.items);
      setTotalPages(data.total_pages);
      setTotalItems(data.total);
    } catch (e: any) {
      showError('Failed to Load Tickets', e?.message ?? "Unable to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await apiFetch<any>("/equipment/");
      // Handle both paginated and non-paginated responses
      const data = response.items || response;
      setEquipment(data);
    } catch (e: any) {
      console.error("Failed to load equipment:", e);
    }
  };

  useEffect(() => {
    loadTickets();
    loadEquipment();
    
    // Check if URL has ?create=true parameter
    if (searchParams.get("create") === "true") {
      setShowForm(true);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    loadTickets();
  }, [filterStatus, filterPriority, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [currentPage]);

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterPriority("");
    setSearchQuery("");
  };

  const handleViewTicket = (ticket: Ticket) => {
    setViewingTicket(ticket);
    setShowViewModal(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description || "");
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority || "medium");
    setShowEditModal(true);
    setShowViewModal(false); // Close view modal if open
  };

  const handleQuickStatusUpdate = (ticket: Ticket) => {
    setQuickStatusTicket(ticket);
    setQuickStatus(ticket.status);
    setShowQuickStatusModal(true);
  };

  const handleSaveQuickStatus = async () => {
    if (!quickStatusTicket) return;

    setUpdating(true);

    try {
      await apiFetch(`/tickets/${quickStatusTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: quickStatus,
        }),
      });
      
      setShowQuickStatusModal(false);
      setQuickStatusTicket(null);
      await loadTickets();
      showSuccess('Status Updated!', 'Ticket status has been updated successfully');
    } catch (e: any) {
      showError('Permission Denied', e?.message ?? "You don't have permission to update this ticket status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;

    setUpdating(true);

    try {
      await apiFetch(`/tickets/${editingTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          priority: editPriority,
        }),
      });
      
      setShowEditModal(false);
      setEditingTicket(null);
      await loadTickets();
      showSuccess('Ticket Updated!', 'Ticket has been updated successfully');
    } catch (e: any) {
      showError('Permission Denied', e?.message ?? "You don't have permission to update this ticket");
    } finally {
      setUpdating(false);
    }
  };

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? `${eq.device_name} (${eq.asset_tag})` : "Unknown Equipment";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch("/tickets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_id: equipmentId,
          title,
          description: description || null,
          priority,
        }),
      });
      setTitle("");
      setDescription("");
      setEquipmentId("");
      setPriority("medium");
      setShowForm(false);
      await loadTickets();
      showSuccess('Ticket Created!', 'Service ticket has been created successfully');
    } catch (e: any) {
      showError('Failed to Create Ticket', e?.message ?? "Unable to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Tickets</h1>
              <p className="text-gray-600 mt-1">Track and manage equipment service requests</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === "table"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("horizontal")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === "horizontal"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Horizontal Cards"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === "grid"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center space-x-2"
            >
              {showForm ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Title, ticket code, description..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            {(filterStatus || filterPriority || searchQuery) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {tickets.length} result{tickets.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">New Service Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment
                </label>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  required
                  className="input-field"
                >
                  <option value="">Select equipment...</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.device_name} ({eq.asset_tag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Brief description of the issue"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the problem..."
                  rows={4}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No tickets found. Try adjusting your filters or create a new ticket.</p>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{ticket.title}</div>
                            {ticket.description && (
                              <div className="text-sm text-gray-500 mt-1 truncate max-w-md">
                                {ticket.description.substring(0, 80)}
                                {ticket.description.length > 80 ? "..." : ""}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ticket.priority && (
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                ticket.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : ticket.priority === "medium"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {ticket.priority.toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              ticket.status === "open"
                                ? "bg-blue-100 text-blue-700"
                                : ticket.status === "in_progress"
                                ? "bg-orange-100 text-orange-700"
                                : ticket.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {ticket.status.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewTicket(ticket)}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleQuickStatusUpdate(ticket)}
                                className="text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Horizontal Cards View */}
            {viewMode === "horizontal" && (
              <div className="space-y-4 mb-8">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                    <div className="flex flex-col lg:flex-row">
                      {/* Left side - Ticket Info */}
                      <div className={`p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r ${
                        ticket.status === 'open'
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                          : ticket.status === 'resolved'
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                            ticket.status === 'open'
                              ? 'bg-blue-500'
                              : ticket.status === 'in_progress'
                              ? 'bg-orange-500'
                              : ticket.status === 'resolved'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }`}>
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{ticket.title}</h3>
                            <p className="text-sm text-gray-600 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              ticket.status === 'open'
                                ? 'bg-blue-200 text-blue-800'
                                : ticket.status === 'in_progress'
                                ? 'bg-orange-200 text-orange-800'
                                : ticket.status === 'resolved'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {ticket.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          {ticket.priority && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Priority:</span>
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                ticket.priority === "high"
                                  ? "bg-red-200 text-red-800"
                                  : ticket.priority === "medium"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-green-200 text-green-800"
                              }`}>
                                {ticket.priority.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Description */}
                      <div className="p-6 lg:w-2/3">
                        {ticket.description ? (
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Description
                            </label>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {ticket.description.length > 200 
                                ? `${ticket.description.substring(0, 200)}...` 
                                : ticket.description}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic mb-4">No description provided</p>
                        )}
                        
                        <div className="flex justify-end pt-4 border-t border-gray-200 space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickStatusUpdate(ticket);
                            }}
                            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Quick Status</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTicket(ticket);
                            }}
                            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center space-x-1"
                          >
                            <span>View Details</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                    {/* Header with gradient */}
                    <div className={`p-6 ${
                      ticket.status === 'open'
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                        : ticket.status === 'in_progress'
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100'
                        : ticket.status === 'resolved'
                        ? 'bg-gradient-to-br from-green-50 to-green-100'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100'
                    }`}>
                      <div className="flex items-center justify-center mb-3">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
                          ticket.status === 'open'
                            ? 'bg-blue-500'
                            : ticket.status === 'in_progress'
                            ? 'bg-orange-500'
                            : ticket.status === 'resolved'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}>
                          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-center text-lg font-bold text-gray-900 mb-1 line-clamp-2">{ticket.title}</h3>
                      <p className="text-center text-sm text-gray-600 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            ticket.status === 'open'
                              ? 'bg-blue-100 text-blue-700'
                              : ticket.status === 'in_progress'
                              ? 'bg-orange-100 text-orange-700'
                              : ticket.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        
                        {ticket.priority && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Priority:</span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              ticket.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : ticket.priority === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {ticket.description && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-700 line-clamp-3">{ticket.description}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStatusUpdate(ticket);
                          }}
                          className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Status</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTicket(ticket);
                          }}
                          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                        >
                          <span>View</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* View Ticket Modal */}
        {showViewModal && viewingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    viewingTicket.status === 'open'
                      ? 'bg-blue-500'
                      : viewingTicket.status === 'in_progress'
                      ? 'bg-orange-500'
                      : viewingTicket.status === 'resolved'
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
                    <p className="text-sm text-gray-500">Created {new Date(viewingTicket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Title
                  </label>
                  <h3 className="text-2xl font-bold text-gray-900">{viewingTicket.title}</h3>
                </div>

                {/* Status and Priority Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg ${
                      viewingTicket.status === 'open'
                        ? 'bg-blue-100 text-blue-700'
                        : viewingTicket.status === 'in_progress'
                        ? 'bg-orange-100 text-orange-700'
                        : viewingTicket.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingTicket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {viewingTicket.priority && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Priority
                      </label>
                      <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg ${
                        viewingTicket.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : viewingTicket.priority === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {viewingTicket.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Equipment
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-lg font-medium text-gray-900">{getEquipmentName(viewingTicket.equipment_id)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </label>
                  {viewingTicket.description ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingTicket.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Created Date
                  </label>
                  <p className="text-gray-900 font-medium">
                    {new Date(viewingTicket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-xl">
                <button
                  onClick={() => handleEditTicket(viewingTicket)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Ticket</span>
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Update Modal */}
        {showQuickStatusModal && quickStatusTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Status Update</h2>
                    <p className="text-sm text-gray-500">Change ticket status</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuickStatusModal(false);
                    setQuickStatusTicket(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Ticket Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Ticket</p>
                  <p className="font-semibold text-gray-900">{quickStatusTicket.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{getEquipmentName(quickStatusTicket.equipment_id)}</p>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickStatus}
                    onChange={(e) => setQuickStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Current vs New Status */}
                <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-1">Current</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      quickStatusTicket.status === 'open'
                        ? 'bg-blue-100 text-blue-700'
                        : quickStatusTicket.status === 'in_progress'
                        ? 'bg-orange-100 text-orange-700'
                        : quickStatusTicket.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {quickStatusTicket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-purple-600 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-1">New</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      quickStatus === 'open'
                        ? 'bg-blue-100 text-blue-700'
                        : quickStatus === 'in_progress'
                        ? 'bg-orange-100 text-orange-700'
                        : quickStatus === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {quickStatus.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowQuickStatusModal(false);
                    setQuickStatusTicket(null);
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuickStatus}
                  disabled={updating || quickStatus === quickStatusTicket.status}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Status</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Ticket Modal */}
        {showEditModal && editingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Ticket</h2>
                    <p className="text-sm text-gray-500">Update ticket information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTicket(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Equipment (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipment
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900 font-medium">{getEquipmentName(editingTicket.equipment_id)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Equipment cannot be changed</p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Brief description of the issue"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Detailed description of the problem..."
                  />
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTicket(null);
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updating || !editTitle.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
