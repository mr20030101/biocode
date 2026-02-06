import { type FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

export function NewEquipmentPage() {
  const nav = useNavigate();
  const [assetTag, setAssetTag] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await apiFetch<Department[]>("/departments/");
      setDepartments(data);
    } catch (e: any) {
      console.error("Failed to load departments:", e);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/equipment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag,
          device_name: deviceName,
          manufacturer: manufacturer || null,
          model: model || null,
          status: "active",
          department_id: departmentId || null,
          serial_number: serialNumber || null,
        }),
      });
      nav("/equipment");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create equipment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Equipment</h1>
          <p className="text-gray-600 mt-1">Add a new device to your inventory</p>
        </div>

        <div className="card">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Tag
              </label>
              <input
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                required
                className="input-field"
                placeholder="e.g., BIO-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                className="input-field"
                placeholder="e.g., X-Ray Machine"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="input-field"
                placeholder="e.g., SN123456789"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Siemens"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Luminos dRF Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="input-field"
              >
                <option value="">Select department (optional)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.code ? `(${dept.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Saving..." : "Save Equipment"}
              </button>
              <button
                type="button"
                onClick={() => nav(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

