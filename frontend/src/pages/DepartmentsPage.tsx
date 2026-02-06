import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Department = {
  id: string;
  name: string;
  code?: string | null;
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
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{dept.name}</h3>
                      {dept.code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {dept.code}</p>
                      )}
                    </div>
                    {canDeleteDepartments() && (
                      <button
                        onClick={() => handleDeleteClick(dept)}
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
      </div>
    </div>
  );
}
