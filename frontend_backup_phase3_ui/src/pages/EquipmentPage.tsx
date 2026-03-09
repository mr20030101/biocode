import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { showError, showSuccess } from "../lib/notifications";

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  supplier_id?: string | null;
  acquisition_date?: string | null;
  acquired_value?: string | null;
  status: string;
  department_id?: string | null;
  location_id?: string | null;
  in_service_date?: string | null;
  notes?: string | null;
  repair_count: number;
};

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

type Supplier = {
  id: string;
  name: string;
  code?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Location = {
  id: string;
  name: string;
  code?: string | null;
};

type PaginatedResponse = {
  items: Equipment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function EquipmentPage() {
  const auth = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Full edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editForm, setEditForm] = useState<Partial<Equipment>>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
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
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
  
  // Quick status edit modal state
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [quickEditEquipment, setQuickEditEquipment] = useState<Equipment | null>(null);
  const [quickEditStatus, setQuickEditStatus] = useState<string>("");

  useEffect(() => {
    loadEquipment();
    loadDepartments();
    loadSuppliers();
    loadLocations();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    loadEquipment();
  }, [filterStatus, filterDepartment, searchQuery]);

  useEffect(() => {
    loadEquipment();
  }, [currentPage]);

  const loadDepartments = async () => {
    try {
      const data = await apiFetch<Department[]>("/departments/");
      setDepartments(data);
    } catch (e: any) {
      console.error("Failed to load departments:", e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await apiFetch<Supplier[]>("/suppliers/");
      setSuppliers(data);
    } catch (e: any) {
      console.error("Failed to load suppliers:", e);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await apiFetch<Location[]>("/locations/");
      setLocations(data);
    } catch (e: any) {
      console.error("Failed to load locations:", e);
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
      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());
      
      const queryString = params.toString();
      const url = `/equipment/?${queryString}`;
      
      const data = await apiFetch<PaginatedResponse>(url);
      setItems(data.items);
      setTotalPages(data.total_pages);
      setTotalItems(data.total);
    } catch (e: any) {
      showError('Failed to Load Equipment', e?.message ?? "Unable to load equipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterDepartment("");
    setSearchQuery("");
    setCurrentPage(1);
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

    try {
      await apiFetch(`/equipment/${deletingEquipment.id}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      await loadEquipment();
      showSuccess('Equipment Deleted!', 'Equipment has been deleted successfully');
    } catch (e: any) {
      showError('Failed to Delete Equipment', e?.message ?? "Unable to delete equipment. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewClick = (equipment: Equipment) => {
    setViewingEquipment(equipment);
    setShowViewModal(true);
  };

  const handleQuickEditClick = (equipment: Equipment) => {
    setQuickEditEquipment(equipment);
    setQuickEditStatus(equipment.status);
    setShowQuickEditModal(true);
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditEquipment) return;

    setUpdating(true);

    try {
      await apiFetch(`/equipment/${quickEditEquipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: quickEditStatus }),
      });
      setShowQuickEditModal(false);
      setQuickEditEquipment(null);
      await loadEquipment();
      showSuccess('Status Updated!', 'Equipment status has been updated successfully');
    } catch (e: any) {
      showError('Failed to Update Status', e?.message ?? "Unable to update equipment status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleFullEditClick = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setEditForm({
      asset_tag: equipment.asset_tag,
      device_name: equipment.device_name,
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      serial_number: equipment.serial_number || "",
      supplier_id: equipment.supplier_id || "",
      acquisition_date: equipment.acquisition_date || "",
      acquired_value: equipment.acquired_value || "",
      status: equipment.status,
      department_id: equipment.department_id || "",
      location_id: equipment.location_id || "",
      in_service_date: equipment.in_service_date || "",
      notes: equipment.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveFullEdit = async () => {
    if (!editingEquipment) return;

    setUpdating(true);

    try {
      // Format dates properly
      const payload: any = { ...editForm };
      
      // Convert empty strings to null for optional fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      await apiFetch(`/equipment/${editingEquipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      setShowEditModal(false);
      setEditingEquipment(null);
      setEditForm({});
      await loadEquipment();
      showSuccess('Equipment Updated!', 'Equipment has been updated successfully');
    } catch (e: any) {
      showError('Failed to Update Equipment', e?.message ?? "Unable to update equipment. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
              <p className="text-gray-600 mt-1">Manage your biomedical equipment inventory</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === "table"
                    ? "bg-blue-100 text-blue-700"
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
                    ? "bg-blue-100 text-blue-700"
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
                    ? "bg-blue-100 text-blue-700"
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
                  placeholder="Device name, asset tag, serial..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No equipment found. Try adjusting your filters or add new equipment.</p>
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
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset Tag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manufacturer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Repairs
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
                            <div className="text-sm text-gray-500">{e.model || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {e.asset_tag}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {e.manufacturer || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              e.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : e.status === 'out_of_service'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {e.status.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${
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
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewClick(e)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View
                              </button>
                              {auth.canCreateEquipment() && (
                                <button
                                  onClick={() => handleFullEditClick(e)}
                                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  Edit
                                </button>
                              )}
                              {auth.canUpdateEquipmentStatus() && (
                                <button
                                  onClick={() => handleQuickEditClick(e)}
                                  className="text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  Status
                                </button>
                              )}
                              {auth.isSuperAdmin() && (
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
                </div>
              </div>
            )}

            {/* Horizontal Cards View */}
            {viewMode === "horizontal" && (
              <div className="space-y-4 mb-8">
                {items.map((e) => (
                <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left side - Equipment Info */}
                    <div className={`p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r ${
                      e.status === 'active' 
                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                        : e.status === 'out_of_service'
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          e.status === 'active' 
                            ? 'bg-green-500' 
                            : e.status === 'out_of_service'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}>
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{e.device_name}</h3>
                          <p className="text-sm text-gray-600 font-medium">{e.asset_tag}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            e.status === 'active' 
                              ? 'bg-green-200 text-green-800' 
                              : e.status === 'out_of_service'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {e.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Repairs:</span>
                          <span className={`font-bold ${
                            e.repair_count === 0
                              ? 'text-green-700'
                              : e.repair_count <= 2
                              ? 'text-orange-700'
                              : 'text-red-700'
                          }`}>
                            {e.repair_count} {e.repair_count === 1 ? 'time' : 'times'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Details & Actions */}
                    <div className="p-6 lg:w-2/3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Manufacturer
                          </label>
                          <p className="text-sm text-gray-900 font-medium">{e.manufacturer || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Model
                          </label>
                          <p className="text-sm text-gray-900 font-medium">{e.model || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Serial Number
                          </label>
                          <p className="text-sm text-gray-900 font-medium">{e.serial_number || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Department
                          </label>
                          <p className="text-sm text-gray-900 font-medium">{getDepartmentName(e.department_id)}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleViewClick(e)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                        
                        {auth.canCreateEquipment() && (
                          <button
                            onClick={() => handleFullEditClick(e)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        )}
                        
                        {auth.canUpdateEquipmentStatus() && (
                          <button
                            onClick={() => handleQuickEditClick(e)}
                            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Quick Edit</span>
                          </button>
                        )}
                        
                        {auth.isSuperAdmin() && (
                          <button
                            onClick={() => handleDeleteClick(e)}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
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
                {items.map((e) => (
                  <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header with gradient */}
                    <div className={`p-6 ${
                      e.status === 'active' 
                        ? 'bg-gradient-to-br from-green-50 to-green-100' 
                        : e.status === 'out_of_service'
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100'
                    }`}>
                      <div className="flex items-center justify-center mb-3">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
                          e.status === 'active' 
                            ? 'bg-green-500' 
                            : e.status === 'out_of_service'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}>
                          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-center text-lg font-bold text-gray-900 mb-1">{e.device_name}</h3>
                      <p className="text-center text-sm text-gray-600 font-medium">{e.asset_tag}</p>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            e.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : e.status === 'out_of_service'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {e.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Repairs:</span>
                          <span className={`font-bold ${
                            e.repair_count === 0
                              ? 'text-green-700'
                              : e.repair_count <= 2
                              ? 'text-orange-700'
                              : 'text-red-700'
                          }`}>
                            {e.repair_count}
                          </span>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
                          <p className="text-sm text-gray-900 font-medium truncate">{e.manufacturer || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Model</p>
                          <p className="text-sm text-gray-900 font-medium truncate">{e.model || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Department</p>
                          <p className="text-sm text-gray-900 font-medium truncate">{getDepartmentName(e.department_id)}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleViewClick(e)}
                          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                        
                        {auth.canCreateEquipment() && (
                          <button
                            onClick={() => handleFullEditClick(e)}
                            className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        )}
                        
                        {auth.canUpdateEquipmentStatus() && (
                          <button
                            onClick={() => handleQuickEditClick(e)}
                            className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Status</span>
                          </button>
                        )}
                        
                        {auth.isSuperAdmin() && (
                          <button
                            onClick={() => handleDeleteClick(e)}
                            className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
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

        {/* Quick Edit Status Modal */}
        {showQuickEditModal && quickEditEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Quick Edit Status</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Update status for{" "}
                <span className="font-semibold">{quickEditEquipment.device_name}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Asset Tag: <span className="font-medium">{quickEditEquipment.asset_tag}</span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={quickEditStatus}
                  onChange={(e) => setQuickEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="active">Active</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveQuickEdit}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
                <button
                  onClick={() => {
                    setShowQuickEditModal(false);
                    setQuickEditEquipment(null);
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

        {/* Edit Equipment Modal */}
        {showEditModal && editingEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Equipment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Basic Information</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.device_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, device_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.asset_tag || ""}
                    onChange={(e) => setEditForm({ ...editForm, asset_tag: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={editForm.manufacturer || ""}
                    onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={editForm.model || ""}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={editForm.serial_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.status || ""}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="out_of_service">Out of Service</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {/* Location & Assignment */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Location & Assignment</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={editForm.department_id || ""}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={editForm.location_id || ""}
                    onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier & Acquisition */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Supplier & Acquisition</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={editForm.supplier_id || ""}
                    onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acquired Value
                  </label>
                  <input
                    type="text"
                    value={editForm.acquired_value || ""}
                    onChange={(e) => setEditForm({ ...editForm, acquired_value: e.target.value })}
                    placeholder="$50,000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acquisition Date
                  </label>
                  <input
                    type="date"
                    value={editForm.acquisition_date?.split('T')[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, acquisition_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In Service Date
                  </label>
                  <input
                    type="date"
                    value={editForm.in_service_date?.split('T')[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, in_service_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="input-field"
                    placeholder="Additional notes about this equipment..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveFullEdit}
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEquipment(null);
                    setEditForm({});
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
    </Layout>
  );
}
