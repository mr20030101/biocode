import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type MaintenanceSchedule = {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  frequency_days: number;
  last_maintenance_date?: string | null;
  next_maintenance_date: string;
  assigned_to_user_id?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  department_id?: string | null;
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

type MaintenanceStats = {
  total_active_schedules: number;
  overdue: number;
  upcoming_7_days: number;
  upcoming_30_days: number;
};

export function MaintenancePage() {
  const auth = useAuth();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filterView, setFilterView] = useState<string>("all"); // all, overdue, upcoming
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  
  // Form states
  const [formEquipmentId, setFormEquipmentId] = useState("");
  const [formMaintenanceType, setFormMaintenanceType] = useState("preventive");
  const [formFrequencyDays, setFormFrequencyDays] = useState("30");
  const [formNextDate, setFormNextDate] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [editMaintenanceType, setEditMaintenanceType] = useState("");
  const [editFrequencyDays, setEditFrequencyDays] = useState("");
  const [editNextDate, setEditNextDate] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterView, filterDepartment, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filterView, filterDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Build query params based on filter
      const params = new URLSearchParams();
      if (filterView === "overdue") {
        params.append("overdue", "true");
      } else if (filterView === "upcoming") {
        params.append("upcoming_days", "30");
      }
      
      if (filterDepartment) {
        params.append("department_id", filterDepartment);
      }
      
      // Add pagination params
      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());
      
      const queryString = params.toString();
      const url = `/maintenance/${queryString ? `?${queryString}` : ""}`;
      
      const [schedulesData, equipmentData, departmentsData, usersData, statsData] = await Promise.all([
        apiFetch<any>(url),
        apiFetch<any>("/equipment/"),
        apiFetch<any>("/departments/"),
        apiFetch<any>("/auth/users"),
        apiFetch<MaintenanceStats>("/maintenance/stats/summary"),
      ]);
      
      // Handle paginated responses
      let allSchedules = schedulesData.items || schedulesData;
      
      // Set pagination info
      if (schedulesData.total !== undefined) {
        setTotalItems(schedulesData.total);
        setTotalPages(schedulesData.total_pages || 1);
      } else {
        setTotalItems(allSchedules.length);
        setTotalPages(1);
      }
      
      // Filter for tech users - only show schedules assigned to them
      if (auth.isTech()) {
        allSchedules = allSchedules.filter((s: MaintenanceSchedule) => s.assigned_to_user_id === auth.user?.id);
      }
      
      setSchedules(allSchedules);
      setEquipment(equipmentData.items || equipmentData);
      setDepartments(departmentsData);
      setUsers((usersData.items || usersData).filter((u: any) => u.role === "tech" || u.role === "supervisor"));
      setStats(statsData);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load maintenance schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate that equipment has a department
    const selectedEquipment = equipment.find(eq => eq.id === formEquipmentId);
    if (!selectedEquipment?.department_id) {
      setError("Selected equipment must have a department assigned");
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch("/maintenance/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_id: formEquipmentId,
          maintenance_type: formMaintenanceType,
          frequency_days: parseInt(formFrequencyDays),
          next_maintenance_date: new Date(formNextDate).toISOString(),
          assigned_to_user_id: formAssignedTo || null,
          notes: formNotes || null,
          is_active: true,
        }),
      });
      
      // Reset form
      setFormEquipmentId("");
      setFormMaintenanceType("preventive");
      setFormFrequencyDays("30");
      setFormNextDate("");
      setFormAssignedTo("");
      setFormNotes("");
      setShowForm(false);
      
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create maintenance schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (scheduleId: string) => {
    if (!confirm("Mark this maintenance as completed?")) return;
    
    try {
      await apiFetch(`/maintenance/${scheduleId}/complete`, {
        method: "POST",
      });
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Failed to complete maintenance");
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Delete this maintenance schedule?")) return;
    
    try {
      await apiFetch(`/maintenance/${scheduleId}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete maintenance schedule");
    }
  };

  const handleEditSchedule = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setEditMaintenanceType(schedule.maintenance_type);
    setEditFrequencyDays(schedule.frequency_days.toString());
    setEditNextDate(schedule.next_maintenance_date.split('T')[0]);
    setEditAssignedTo(schedule.assigned_to_user_id || "");
    setEditNotes(schedule.notes || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/maintenance/${editingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance_type: editMaintenanceType,
          frequency_days: parseInt(editFrequencyDays),
          next_maintenance_date: new Date(editNextDate).toISOString(),
          assigned_to_user_id: editAssignedTo || null,
          notes: editNotes || null,
        }),
      });
      
      setShowEditModal(false);
      setEditingSchedule(null);
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update maintenance schedule");
    } finally {
      setUpdating(false);
    }
  };

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? `${eq.device_name} (${eq.asset_tag})` : "Unknown";
  };

  const getDepartmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq || !eq.department_id) return "No Department";
    const dept = departments.find(d => d.id === eq.department_id);
    return dept ? dept.name : "Unknown";
  };

  const getUserName = (userId?: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user ? user.full_name : "Unknown";
  };

  const getStatusColor = (nextDate: string) => {
    const next = new Date(nextDate);
    const now = new Date();
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "bg-red-100 text-red-700"; // Overdue
    if (diffDays <= 7) return "bg-orange-100 text-orange-700"; // Due soon
    return "bg-green-100 text-green-700"; // On schedule
  };

  const getStatusText = (nextDate: string) => {
    const next = new Date(nextDate);
    const now = new Date();
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Schedules</h1>
              <p className="text-gray-600 mt-1">Manage preventive maintenance and calibration schedules</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === "table"
                    ? "bg-purple-100 text-purple-700"
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
                    ? "bg-purple-100 text-purple-700"
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
                    ? "bg-purple-100 text-purple-700"
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
            
            {auth.isSupervisorOrAbove() && (
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
                    <span>Add Schedule</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {auth.isTech() ? "My Active Tasks" : "Total Active"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {auth.isTech() ? schedules.length : stats.total_active_schedules}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card cursor-pointer hover:shadow-md" onClick={() => setFilterView("overdue")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {auth.isTech() 
                      ? schedules.filter(s => new Date(s.next_maintenance_date) < new Date()).length
                      : stats.overdue}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card cursor-pointer hover:shadow-md" onClick={() => setFilterView("upcoming")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Next 7 Days</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {auth.isTech()
                      ? schedules.filter(s => {
                          const next = new Date(s.next_maintenance_date);
                          const now = new Date();
                          const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return diffDays >= 0 && diffDays <= 7;
                        }).length
                      : stats.upcoming_7_days}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Next 30 Days</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {auth.isTech()
                      ? schedules.filter(s => {
                          const next = new Date(s.next_maintenance_date);
                          const now = new Date();
                          const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return diffDays >= 0 && diffDays <= 30;
                        }).length
                      : stats.upcoming_30_days}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterView("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterView === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Schedules
            </button>
            <button
              onClick={() => setFilterView("overdue")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterView === "overdue"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setFilterView("upcoming")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterView === "upcoming"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Upcoming (30 days)
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Department:</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {filterDepartment && (
              <button
                onClick={() => setFilterDepartment("")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">New Maintenance Schedule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formEquipmentId}
                    onChange={(e) => setFormEquipmentId(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">Select equipment...</option>
                    {equipment
                      .filter(eq => eq.department_id) // Only show equipment with department
                      .map((eq) => {
                        const dept = departments.find(d => d.id === eq.department_id);
                        return (
                          <option key={eq.id} value={eq.id}>
                            {eq.device_name} ({eq.asset_tag}) - {dept ? dept.name : 'No Dept'}
                          </option>
                        );
                      })}
                  </select>
                  {equipment.filter(eq => !eq.department_id).length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Note: Equipment without departments are hidden
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEquipmentId ? getDepartmentName(formEquipmentId) : ''}
                    disabled
                    className="input-field bg-gray-100 cursor-not-allowed"
                    placeholder="Select equipment first"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled from equipment</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formMaintenanceType}
                    onChange={(e) => setFormMaintenanceType(e.target.value)}
                    className="input-field"
                  >
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="calibration">Calibration</option>
                    <option value="inspection">Inspection</option>
                    <option value="safety_check">Safety Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formFrequencyDays}
                    onChange={(e) => setFormFrequencyDays(e.target.value)}
                    required
                    min="1"
                    className="input-field"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Maintenance Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To (Optional)
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="Additional notes or instructions..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Creating..." : "Create Schedule"}
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

        {/* Schedules List */}
        {error && !showForm && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              {auth.isTech() ? (
                <>
                  {filterView === "all" && "No maintenance tasks assigned to you yet."}
                  {filterView === "overdue" && "No overdue maintenance tasks. Great job!"}
                  {filterView === "upcoming" && "No maintenance tasks scheduled in the next 30 days."}
                </>
              ) : (
                <>
                  {filterView === "all" && "No maintenance schedules yet. Create your first schedule."}
                  {filterView === "overdue" && "No overdue maintenance. Great job!"}
                  {filterView === "upcoming" && "No maintenance scheduled in the next 30 days."}
                </>
              )}
            </p>
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
                          Equipment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Due
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {auth.isSupervisorOrAbove() && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{getEquipmentName(schedule.equipment_id)}</div>
                            <div className="text-sm text-gray-500">{getDepartmentName(schedule.equipment_id)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              {schedule.maintenance_type.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(schedule.next_maintenance_date).toLocaleDateString()}
                            <div className="text-xs text-gray-400">Every {schedule.frequency_days} days</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getUserName(schedule.assigned_to_user_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.next_maintenance_date)}`}>
                              {getStatusText(schedule.next_maintenance_date)}
                            </span>
                          </td>
                          {auth.isSupervisorOrAbove() && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditSchedule(schedule)}
                                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleComplete(schedule.id)}
                                  className="text-green-600 hover:text-green-700 font-medium"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleDelete(schedule.id)}
                                  className="text-red-600 hover:text-red-700 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Horizontal Cards View */}
            {viewMode === "horizontal" && (
              <div className="space-y-4">
                {schedules.map((schedule) => {
                  const next = new Date(schedule.next_maintenance_date);
                  const now = new Date();
                  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;
                  const isDueSoon = diffDays >= 0 && diffDays <= 7;
                  
                  return (
                    <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row">
                        {/* Left side - Schedule Info */}
                        <div className={`p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r ${
                          isOverdue
                            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                            : isDueSoon
                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                              isOverdue
                                ? 'bg-red-500'
                                : isDueSoon
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}>
                              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">{getEquipmentName(schedule.equipment_id)}</h3>
                              <p className="text-sm text-gray-600 font-medium">{getDepartmentName(schedule.equipment_id)}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                isOverdue
                                  ? 'bg-red-200 text-red-800'
                                  : isDueSoon
                                  ? 'bg-orange-200 text-orange-800'
                                  : 'bg-green-200 text-green-800'
                              }`}>
                                {getStatusText(schedule.next_maintenance_date)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium text-gray-900">{schedule.maintenance_type.replace("_", " ")}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side - Details & Actions */}
                        <div className="p-6 lg:w-2/3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Next Due Date
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{new Date(schedule.next_maintenance_date).toLocaleDateString()}</p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Frequency
                              </label>
                              <p className="text-sm text-gray-900 font-medium">Every {schedule.frequency_days} days</p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Assigned To
                              </label>
                              <p className="text-sm text-gray-900 font-medium">{getUserName(schedule.assigned_to_user_id)}</p>
                            </div>
                            
                            {schedule.notes && (
                              <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                  Notes
                                </label>
                                <p className="text-sm text-gray-700">{schedule.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          {auth.isSupervisorOrAbove() && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleEditSchedule(schedule)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleComplete(schedule.id)}
                                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Complete</span>
                              </button>
                              
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((schedule) => {
                  const next = new Date(schedule.next_maintenance_date);
                  const now = new Date();
                  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;
                  const isDueSoon = diffDays >= 0 && diffDays <= 7;
                  
                  return (
                    <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Header with gradient */}
                      <div className={`p-6 ${
                        isOverdue
                          ? 'bg-gradient-to-br from-red-50 to-red-100'
                          : isDueSoon
                          ? 'bg-gradient-to-br from-orange-50 to-orange-100'
                          : 'bg-gradient-to-br from-green-50 to-green-100'
                      }`}>
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
                            isOverdue
                              ? 'bg-red-500'
                              : isDueSoon
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}>
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-1 line-clamp-2">{getEquipmentName(schedule.equipment_id)}</h3>
                        <p className="text-center text-sm text-gray-600 font-medium">{getDepartmentName(schedule.equipment_id)}</p>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status:</span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              isOverdue
                                ? 'bg-red-100 text-red-700'
                                : isDueSoon
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {getStatusText(schedule.next_maintenance_date)}
                            </span>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Type</p>
                            <p className="text-sm text-gray-900 font-medium">{schedule.maintenance_type.replace("_", " ")}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Next Due</p>
                            <p className="text-sm text-gray-900 font-medium">{new Date(schedule.next_maintenance_date).toLocaleDateString()}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Frequency</p>
                            <p className="text-sm text-gray-900 font-medium">Every {schedule.frequency_days} days</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                            <p className="text-sm text-gray-900 font-medium truncate">{getUserName(schedule.assigned_to_user_id)}</p>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {auth.isSupervisorOrAbove() && (
                          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => handleEditSchedule(schedule)}
                              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleComplete(schedule.id)}
                              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Done</span>
                            </button>
                            
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination */}
            {schedules.length > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Edit Maintenance Schedule Modal */}
        {showEditModal && editingSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Maintenance Schedule</h2>
                    <p className="text-sm text-gray-500">Update schedule information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSchedule(null);
                    setError(null);
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
                    <p className="text-gray-900 font-medium">{getEquipmentName(editingSchedule.equipment_id)}</p>
                    <p className="text-sm text-gray-600 mt-1">{getDepartmentName(editingSchedule.equipment_id)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Equipment cannot be changed</p>
                </div>

                {/* Maintenance Type and Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maintenance Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editMaintenanceType}
                      onChange={(e) => setEditMaintenanceType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="preventive">Preventive Maintenance</option>
                      <option value="calibration">Calibration</option>
                      <option value="inspection">Inspection</option>
                      <option value="safety_check">Safety Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frequency (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editFrequencyDays}
                      onChange={(e) => setEditFrequencyDays(e.target.value)}
                      required
                      min="1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Next Maintenance Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Next Maintenance Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editNextDate}
                    onChange={(e) => setEditNextDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Additional notes or instructions..."
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSchedule(null);
                    setError(null);
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updating || !editFrequencyDays || !editNextDate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
