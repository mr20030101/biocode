import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Department = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  status: string;
  manufacturer?: string | null;
  model?: string | null;
};

type Ticket = {
  id: string;
  ticket_code: string;
  title?: string | null;
  status: string;
  priority?: string | null;
  created_at: string;
};

type MaintenanceSchedule = {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  next_maintenance_date: string;
  is_active: boolean;
};

type DepartmentDetails = {
  department: Department;
  equipment: Equipment[];
  tickets: Ticket[];
  maintenance_schedules: MaintenanceSchedule[];
  stats: {
    total_equipment: number;
    active_equipment: number;
    total_tickets: number;
    open_tickets: number;
    total_maintenance: number;
    overdue_maintenance: number;
  };
};

export function DepartmentsPage() {
  const auth = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Department details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentDetails, setDepartmentDetails] = useState<DepartmentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Department[]>("/departments/");
      setDepartments(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/departments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code || null }),
      });
      setName("");
      setCode("");
      setShowForm(false);
      await loadDepartments();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  const canManageDepartments = () => auth.user?.role !== "viewer" && auth.user?.role !== "tech";
  const canDeleteDepartments = () => auth.isSuperAdmin();

  const handleDeleteClick = (dept: Department) => {
    setDeletingDepartment(dept);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDepartment) return;

    setDeleting(true);
    setError(null);

    try {
      await apiFetch(`/departments/${deletingDepartment.id}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      await loadDepartments();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const handleDepartmentClick = async (dept: Department) => {
    setSelectedDepartment(dept);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setError(null);

    try {
      // Fetch all related data
      const [equipmentData, ticketsData, maintenanceData] = await Promise.all([
        apiFetch<Equipment[]>(`/equipment/?department_id=${dept.id}`),
        apiFetch<Ticket[]>(`/tickets/?department_id=${dept.id}`),
        apiFetch<MaintenanceSchedule[]>(`/maintenance/?department_id=${dept.id}`),
      ]);

      // Calculate stats
      const now = new Date();
      const stats = {
        total_equipment: equipmentData.length,
        active_equipment: equipmentData.filter(e => e.status === 'active').length,
        total_tickets: ticketsData.length,
        open_tickets: ticketsData.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        total_maintenance: maintenanceData.filter(m => m.is_active).length,
        overdue_maintenance: maintenanceData.filter(
          m => m.is_active && new Date(m.next_maintenance_date) < now
        ).length,
      };

      setDepartmentDetails({
        department: dept,
        equipment: equipmentData,
        tickets: ticketsData,
        maintenance_schedules: maintenanceData,
        stats,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load department details");
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-600 mt-1">Organize equipment by department</p>
          </div>
          {canManageDepartments() && (
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
                  <span>Add Department</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">New Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Radiology"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code (Optional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., RAD"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Creating..." : "Create Department"}
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

        {/* Departments List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Departments</h2>

          {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}
          {error && !showForm && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border-2 border-transparent hover:border-blue-200"
                  onClick={() => handleDepartmentClick(dept)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-600 hover:text-blue-700">{dept.name}</h3>
                      {dept.code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {dept.code}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">Click to view details</p>
                    </div>
                    {canDeleteDepartments() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(dept);
                        }}
                        className="ml-2 text-red-600 hover:text-red-700 p-1"
                        title="Delete department"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!departments.length && !error && (
                <div className="col-span-full text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No departments yet. Add your first department.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Delete Department</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingDepartment.name}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone. All equipment in this department will need to be reassigned.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete Department"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
                  }}
                  disabled={deleting}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Details Modal */}
        {showDetailsModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDepartment.name}</h2>
                  {selectedDepartment.code && (
                    <p className="text-sm text-gray-500 mt-1">Code: {selectedDepartment.code}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDepartmentDetails(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingDetails ? (
                  <div className="text-center py-12 text-gray-500">Loading department details...</div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                ) : departmentDetails ? (
                  <div className="space-y-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Total Equipment</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {departmentDetails.stats.total_equipment}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">Active</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {departmentDetails.stats.active_equipment}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium">Total Tickets</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">
                          {departmentDetails.stats.total_tickets}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 font-medium">Open Tickets</p>
                        <p className="text-2xl font-bold text-orange-900 mt-1">
                          {departmentDetails.stats.open_tickets}
                        </p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-indigo-600 font-medium">Maintenance</p>
                        <p className="text-2xl font-bold text-indigo-900 mt-1">
                          {departmentDetails.stats.total_maintenance}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-red-600 font-medium">Overdue</p>
                        <p className="text-2xl font-bold text-red-900 mt-1">
                          {departmentDetails.stats.overdue_maintenance}
                        </p>
                      </div>
                    </div>

                    {/* Equipment Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Equipment ({departmentDetails.equipment.length})
                      </h3>
                      {departmentDetails.equipment.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                          {departmentDetails.equipment.map((eq) => (
                            <div key={eq.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{eq.device_name}</p>
                                <p className="text-sm text-gray-500">
                                  {eq.asset_tag} {eq.manufacturer && `• ${eq.manufacturer}`} {eq.model && `${eq.model}`}
                                </p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                eq.status === 'active' ? 'bg-green-100 text-green-700' :
                                eq.status === 'out_of_service' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {eq.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No equipment in this department</p>
                      )}
                    </div>

                    {/* Tickets Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Tickets ({departmentDetails.tickets.length})
                      </h3>
                      {departmentDetails.tickets.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                          {departmentDetails.tickets.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{ticket.ticket_code}</p>
                                <p className="text-sm text-gray-500">{ticket.title || 'No title'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {ticket.priority && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {ticket.priority}
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                  ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No tickets for this department</p>
                      )}
                    </div>

                    {/* Maintenance Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Maintenance Schedules ({departmentDetails.maintenance_schedules.filter(m => m.is_active).length})
                      </h3>
                      {departmentDetails.maintenance_schedules.filter(m => m.is_active).length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                          {departmentDetails.maintenance_schedules
                            .filter(m => m.is_active)
                            .map((schedule) => {
                              const equipment = departmentDetails.equipment.find(e => e.id === schedule.equipment_id);
                              const nextDate = new Date(schedule.next_maintenance_date);
                              const now = new Date();
                              const isOverdue = nextDate < now;
                              const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              
                              return (
                                <div key={schedule.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {equipment?.device_name || 'Unknown Equipment'}
                                    </p>
                                    <p className="text-sm text-gray-500 capitalize">
                                      {schedule.maintenance_type.replace('_', ' ')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Next: {nextDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    isOverdue ? 'bg-red-100 text-red-700' :
                                    daysUntil <= 7 ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {isOverdue ? `Overdue ${Math.abs(daysUntil)}d` :
                                     daysUntil === 0 ? 'Due today' :
                                     daysUntil === 1 ? 'Due tomorrow' :
                                     `${daysUntil} days`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No active maintenance schedules</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
