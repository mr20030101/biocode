import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  support_type?: string | null;
  is_active: boolean;
  department_id?: string | null;
};

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

type PaginatedResponse = {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function UsersPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSupportType, setEditSupportType] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Deactivate modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  
  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("support");
  const [newSupportType, setNewSupportType] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());
      
      const queryString = params.toString();
      const usersUrl = `/auth/users?${queryString}`;
      
      const [usersData, departmentsData] = await Promise.all([
        apiFetch<PaginatedResponse>(usersUrl),
        apiFetch<any>("/departments/"),
      ]);
      
      setUsers(usersData.items);
      setTotalPages(usersData.total_pages);
      setTotalItems(usersData.total);
      setDepartments(departmentsData);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditFullName(user.full_name);
    setEditRole(user.role);
    setEditSupportType(user.support_type || "");
    setEditDepartmentId(user.department_id || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/auth/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          full_name: editFullName,
          role: editRole,
          support_type: editRole === "support" ? editSupportType || null : null,
          department_id: editDepartmentId || null,
        }),
      });
      setShowEditModal(false);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivateClick = (user: User) => {
    setDeactivatingUser(user);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/auth/users/${deactivatingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !deactivatingUser.is_active,
        }),
      });
      setShowDeactivateModal(false);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update user status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newFullName || !newPassword) {
      setError("All fields are required");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          full_name: newFullName,
          role: newRole,
          support_type: newRole === "support" ? newSupportType || null : null,
          password: newPassword,
          department_id: newDepartmentId || null,
        }),
      });
      setShowAddModal(false);
      setNewEmail("");
      setNewFullName("");
      setNewRole("support");
      setNewSupportType("");
      setNewPassword("");
      setNewDepartmentId("");
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create user");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/auth/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete user");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "department_head":
        return "bg-indigo-100 text-indigo-700";
      case "support":
        return "bg-green-100 text-green-700";
      case "department_incharge":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatRoleDisplay = (role: string, supportType?: string | null) => {
    const roleText = role.replace("_", " ");
    if (role === "support" && supportType) {
      // Format support type for display
      const typeMap: Record<string, string> = {
        biomed_tech: "Biomed Tech",
        maintenance_aircon: "Aircon Tech",
        maintenance_plumber: "Plumber",
        maintenance_carpenter: "Carpenter",
        maintenance_painter: "Painter",
        maintenance_electrician: "Electrician",
        it_staff: "IT Staff",
        house_keeping: "House Keeping",
        other: "Other"
      };
      const supportTypeText = typeMap[supportType] || supportType.replace("_", " ");
      return `${roleText} (${supportTypeText})`;
    }
    return roleText;
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  const getDepartmentName = (departmentId?: string | null) => {
    if (!departmentId) return "No Department";
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : "Unknown";
  };

  // Redirect if not super_admin
  if (!auth.isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="mt-2 text-sm text-gray-500">
                Only super administrators can access user management.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their roles</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add User</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-sm font-medium text-purple-700">Super Admin Only</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>

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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
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
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => nav(`/users/${user.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {getDepartmentName(user.department_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {formatRoleDisplay(user.role, user.support_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                            user.is_active
                          )}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                          onClick={() => handleEditClick(user)}
                        >
                          Edit
                        </button>
                        {user.id !== auth.user?.id && (
                          <>
                            <button
                              className={`font-medium mr-4 ${
                                user.is_active
                                  ? "text-orange-600 hover:text-orange-700"
                                  : "text-green-600 hover:text-green-700"
                              }`}
                              onClick={() => handleDeactivateClick(user)}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="text-red-600 hover:text-red-700 font-medium"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!users.length && !error && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No users found.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && users.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="input-field"
                  >
                    <option value="support">Support</option>
                    <option value="department_head">Department Head</option>
                    <option value="manager">Manager</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="department_incharge">Department Incharge</option>
                  </select>
                </div>

                {newRole === "support" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Type
                    </label>
                    <select
                      value={newSupportType}
                      onChange={(e) => setNewSupportType(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Type</option>
                      <option value="biomed_tech">Biomed Tech</option>
                      <optgroup label="Maintenance/Facility">
                        <option value="maintenance_aircon">Aircon Tech</option>
                        <option value="maintenance_plumber">Plumber</option>
                        <option value="maintenance_carpenter">Carpenter</option>
                        <option value="maintenance_painter">Painter</option>
                        <option value="maintenance_electrician">Electrician</option>
                      </optgroup>
                      <option value="it_staff">IT Staff</option>
                      <option value="house_keeping">House Keeping</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code && `(${dept.code})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddUser}
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? "Creating..." : "Create User"}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmail("");
                    setNewFullName("");
                    setNewRole("support");
                    setNewSupportType("");
                    setNewPassword("");
                    setNewDepartmentId("");
                    setError(null);
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

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="input-field"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="manager">Manager</option>
                    <option value="department_head">Department Head</option>
                    <option value="support">Support</option>
                    <option value="department_incharge">Department Incharge</option>
                  </select>
                </div>

                {editRole === "support" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Type
                    </label>
                    <select
                      value={editSupportType}
                      onChange={(e) => setEditSupportType(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Type</option>
                      <option value="biomed_tech">Biomed Tech</option>
                      <optgroup label="Maintenance/Facility">
                        <option value="maintenance_aircon">Aircon Tech</option>
                        <option value="maintenance_plumber">Plumber</option>
                        <option value="maintenance_carpenter">Carpenter</option>
                        <option value="maintenance_painter">Painter</option>
                        <option value="maintenance_electrician">Electrician</option>
                      </optgroup>
                      <option value="it_staff">IT Staff</option>
                      <option value="house_keeping">House Keeping</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code && `(${dept.code})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setError(null);
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

        {/* Deactivate/Activate User Modal */}
        {showDeactivateModal && deactivatingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  deactivatingUser.is_active ? "bg-orange-100" : "bg-green-100"
                }`}>
                  <svg
                    className={`w-6 h-6 ${
                      deactivatingUser.is_active ? "text-orange-600" : "text-green-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {deactivatingUser.is_active ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {deactivatingUser.is_active ? "Deactivate" : "Activate"} User
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to {deactivatingUser.is_active ? "deactivate" : "activate"}{" "}
                <span className="font-semibold">{deactivatingUser.full_name}</span>?
                {deactivatingUser.is_active && (
                  <span className="block mt-2 text-sm text-orange-600">
                    This user will no longer be able to access the system.
                  </span>
                )}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmDeactivate}
                  disabled={updating}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    deactivatingUser.is_active
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {updating
                    ? "Processing..."
                    : deactivatingUser.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setError(null);
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

        {/* Delete User Modal */}
        {showDeleteModal && deletingUser && (
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
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Delete User</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold">{deletingUser.full_name}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone. All user data will be permanently removed from the system.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  {updating ? "Deleting..." : "Delete User"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
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

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Support Staff</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter((u) => u.role === "support").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Managers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter((u) => u.role === "manager").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter((u) => u.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
