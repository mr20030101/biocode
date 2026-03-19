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
  const [equipmentName, setEquipmentName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [installationDate, setInstallationDate] = useState("");

  const [acquisitionType, setAcquisitionType] =
    useState<"Owned" | "Tie-up">("Owned");

  const [lifecycleType, setLifecycleType] =
    useState<"years" | "hours">("years");

  const [lifecycleYears, setLifecycleYears] = useState<number | "">("");
  const [maxOperatingHours, setMaxOperatingHours] = useState<number | "">("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await apiFetch<Department[]>("/departments/");
      setDepartments(data ?? []);
    } catch (e) {
      console.error("Failed to load departments:", e);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ STRICT VALIDATION
    if (!assetTag.trim()) {
      setError("Asset Tag is required");
      return;
    }

    if (!equipmentName.trim()) {
      setError("Equipment Name is required");
      return;
    }

    if (lifecycleType === "years" && lifecycleYears === "") {
      setError("Lifecycle Years is required");
      return;
    }

    if (lifecycleType === "hours" && maxOperatingHours === "") {
      setError("Max Operating Hours is required");
      return;
    }

    setSubmitting(true);

    try {
      // ✅ SAFE DATE FORMAT
      let formattedDate: string | null = null;
      if (installationDate) {
        const d = new Date(installationDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split("T")[0];
        }
      }

      // 🔥 FINAL PAYLOAD (BACKEND SAFE)
      const payload = {
        asset_tag: assetTag.trim(),
        equipment_name: equipmentName.trim(),

        model: model.trim() || null,
        brand: manufacturer.trim() || null,
        serial_number: serialNumber.trim() || null,

        acquisition_type: acquisitionType,
        status: "active",

        department_id: departmentId || null,
        installation_date: formattedDate,

        lifecycle_type: lifecycleType,

        lifecycle_years:
          lifecycleType === "years" && lifecycleYears !== ""
            ? Number(lifecycleYears)
            : null,

        max_operating_hours:
          lifecycleType === "hours" && maxOperatingHours !== ""
            ? Number(maxOperatingHours)
            : null,
      };

      console.log("Submitting payload:", payload);

      await apiFetch("/equipment/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      nav("/equipment");
    } catch (err) {
      console.error("Submit error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create equipment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            New Equipment
          </h1>

          <p className="text-gray-600 mt-1">
            Add a new device to your inventory
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              required
              className="input-field"
              placeholder="Asset Tag"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Name
              </label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                required
                className="input-field"
                placeholder="Enter equipment name"
              />
            </div>

            <select
              value={acquisitionType}
              onChange={(e) =>
                setAcquisitionType(e.target.value as "Owned" | "Tie-up")
              }
              className="input-field"
            >
              <option value="Owned">Owned</option>
              <option value="Tie-up">Tie-up</option>
            </select>

            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="input-field"
              placeholder="Serial Number"
            />

            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="input-field"
              placeholder="Manufacturer"
            />

            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-field"
              placeholder="Model (Optional)"
            />

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="input-field"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
              className="input-field"
            />

            <select
              value={lifecycleType}
              onChange={(e) =>
                setLifecycleType(e.target.value as "years" | "hours")
              }
              className="input-field"
            >
              <option value="years">Standard Equipment (Years)</option>
              <option value="hours">Dialysis Machine (Hours)</option>
            </select>

            {lifecycleType === "years" && (
              <input
                type="number"
                value={lifecycleYears}
                onChange={(e) =>
                  setLifecycleYears(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="input-field"
                placeholder="Lifecycle Years"
              />
            )}

            {lifecycleType === "hours" && (
              <input
                type="number"
                value={maxOperatingHours}
                onChange={(e) =>
                  setMaxOperatingHours(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="input-field"
                placeholder="Max Operating Hours"
              />
            )}

            {error && <div className="text-red-500">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Saving..." : "Save Equipment"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}