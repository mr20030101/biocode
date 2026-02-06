import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  manufacturer?: string | null;
  model?: string | null;
  status: string;
  department_id?: string | null;
  repair_count: number;
};

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

export function EquipmentPage() {
  const auth = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    loadEquipment();
    loadDepartments();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [filterStatus, filterDepartment, searchQuery]);

  const loadDepartments = async () => {
    try {
      const data = await apiFetch<Department[]>("/departments/");
      setDepartments(data);
    } catch (e: any) {
      console.error("Failed to load departments:", e);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterDepartment) params.append("department_id", filterDepartment);
      if (searchQuery) params.append("search", searchQuery);
      
      const queryString = params.toString();
      const url = `/equipment/${queryString ? `?${queryString}` : ""}`;
      
      const data = await apiFetch<Equipment[]>(url);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterDepartment("");
    setSearchQuery("");
  };

  const handleEditStatus = (equipment: Equipment) => {
    setEditingId(equipment.id);
    setEditStatus(equipment.status);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus("");
  };

  const handleSaveStatus = async (equipmentId: string) => {
    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/equipment/${equipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      setEditingId(null);
      await loadEquipment();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getDepartmentName = (departmentId?: string | null) => {
    if (!departmentId) return "-";
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : "-";
  };

  const handleDeleteClick = (equipment: Equipment) => {
    setDeletingEquipment(equipment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEquipment) return;

    setDeleting(true);
    setError(null);

    try {
      await apiFetch(`/equipment/${deletingEquipment.id}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      await loadEquipment();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete equipment");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewClick = (equipment: Equipment) => {
    setViewingEquipment(equipment);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
            <p className="text-gray-600 mt-1">Manage your biomedical equipment inventory</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            
            {/* Only show Add Equipment button for supervisor and super_admin */}
            {auth.canCreateEquipment() && (
              <Link to="/equipment/new">
                <button className="btn-primary flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Equipment</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Device name, asset tag, serial..."
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {(filterStatus || filterDepartment || searchQuery) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {items.length} result{items.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Times Fixed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{e.device_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {e.asset_tag}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === e.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="out_of_service">Out of Service</option>
                            <option value="retired">Retired</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            e.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : e.status === 'out_of_service'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {e.status.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          e.repair_count === 0
                            ? 'text-green-700'
                            : e.repair_count <= 2
                            ? 'text-orange-700'
                            : 'text-red-700'
                        }`}>
                          {e.repair_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          {/* View button for all users */}
                          <button
                            onClick={() => handleViewClick(e)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </button>
                          
                          {/* Only show Edit Status for supervisor and super_admin */}
                          {auth.canUpdateEquipmentStatus() && editingId === e.id ? (
                            <>
                              <button
                                onClick={() => handleSaveStatus(e.id)}
                                disabled={updating}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                {updating ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updating}
                                className="text-gray-600 hover:text-gray-700 font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          ) : auth.canUpdateEquipmentStatus() && (
                            <button
                              onClick={() => handleEditStatus(e)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          
                          {/* Only super_admin can delete */}
                          {auth.isSuperAdmin() && editingId !== e.id && (
                            <button
                              onClick={() => handleDeleteClick(e)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {!items.length && !error && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No equipment yet. Add your first device to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Equipment Modal */}
        {showViewModal && viewingEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Equipment Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Device Name */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Device Name</label>
                  <p className="text-lg font-semibold text-gray-900">{viewingEquipment.device_name}</p>
                </div>

                {/* Asset Tag */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Asset Tag</label>
                  <p className="text-base text-gray-900">{viewingEquipment.asset_tag}</p>
                </div>

                {/* Department */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                  <p className="text-base text-gray-900">{getDepartmentName(viewingEquipment.department_id)}</p>
                </div>

                {/* Manufacturer */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Manufacturer</label>
                  <p className="text-base text-gray-900">{viewingEquipment.manufacturer || "Not specified"}</p>
                </div>

                {/* Model */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Model</label>
                  <p className="text-base text-gray-900">{viewingEquipment.model || "Not specified"}</p>
                </div>

                {/* Status */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    viewingEquipment.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : viewingEquipment.status === 'out_of_service'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingEquipment.status.replace("_", " ")}
                  </span>
                </div>

                {/* Repair Count */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Times Fixed</label>
                  <p className={`text-base font-semibold ${
                    viewingEquipment.repair_count === 0
                      ? 'text-green-700'
                      : viewingEquipment.repair_count <= 2
                      ? 'text-orange-700'
                      : 'text-red-700'
                  }`}>
                    {viewingEquipment.repair_count} {viewingEquipment.repair_count === 1 ? 'time' : 'times'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingEquipment && (
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
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Delete Equipment</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingEquipment.device_name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-1">
                Asset Tag: <span className="font-medium">{deletingEquipment.asset_tag}</span>
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone. All related tickets and history will be affected.
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
                  {deleting ? "Deleting..." : "Delete Equipment"}
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
      </div>
    </div>
  );
}
