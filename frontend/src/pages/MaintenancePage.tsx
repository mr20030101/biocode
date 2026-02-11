import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
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
  
  // Form states
  const [formEquipmentId, setFormEquipmentId] = useState("");
  const [formMaintenanceType, setFormMaintenanceType] = useState("preventive");
  const [formFrequencyDays, setFormFrequencyDays] = useState("30");
  const [formNextDate, setFormNextDate] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Schedules</h1>
            <p className="text-gray-600 mt-1">Manage preventive maintenance and calibration schedules</p>
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
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {filterView === "all" && "All Maintenance Schedules"}
            {filterView === "overdue" && "Overdue Maintenance"}
            {filterView === "upcoming" && "Upcoming Maintenance (30 days)"}
          </h2>

          {error && !showForm && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {getEquipmentName(schedule.equipment_id)}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {getDepartmentName(schedule.equipment_id)}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {schedule.maintenance_type.replace("_", " ")}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.next_maintenance_date)}`}>
                        {getStatusText(schedule.next_maintenance_date)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Next Due:</span>{" "}
                        {new Date(schedule.next_maintenance_date).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Frequency:</span> Every {schedule.frequency_days} days
                      </p>
                      <p>
                        <span className="font-medium">Assigned To:</span> {getUserName(schedule.assigned_to_user_id)}
                      </p>
                      {schedule.notes && (
                        <p>
                          <span className="font-medium">Notes:</span> {schedule.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {auth.isSupervisorOrAbove() && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleComplete(schedule.id)}
                        className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!schedules.length && !error && (
                <div className="text-center py-12">
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
