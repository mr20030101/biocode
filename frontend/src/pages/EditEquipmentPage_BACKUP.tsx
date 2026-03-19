import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { showError } from "../lib/notifications";
import { Layout } from "../components/Layout";

type Equipment = {
    asset_tag?: string;
    equipment_name?: string;
    ownership_type?: string;
    serial_number?: string;
    manufacturer?: string;
    model?: string;
    department_id?: string;
    installation_date?: string;
    lifecycle_years?: number | string;
};

type Department = {
    id: string;
    name: string;
};

export function EditEquipmentPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<Equipment>({
        asset_tag: "",
        equipment_name: "",
        ownership_type: "Owned",
        serial_number: "",
        manufacturer: "",
        model: "",
        department_id: "",
        installation_date: "",
        lifecycle_years: "",
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Load equipment + departments
    useEffect(() => {
        async function fetchData() {
            try {
                if (!id) return;

                const [equipmentData, deptData] = await Promise.all([
                    apiFetch<Equipment>(`/equipment/${id}`),
                    apiFetch<Department[]>("/departments"),
                ]);

                setForm({
                    asset_tag: equipmentData?.asset_tag ?? "",
                    equipment_name: equipmentData?.equipment_name ?? "",
                    ownership_type: equipmentData?.ownership_type ?? "Owned",
                    serial_number: equipmentData?.serial_number ?? "",
                    manufacturer: equipmentData?.manufacturer ?? "",
                    model: equipmentData?.model ?? "",
                    department_id: equipmentData?.department_id ?? "",
                    installation_date: equipmentData?.installation_date ?? "",
                    lifecycle_years: equipmentData?.lifecycle_years ?? "",
                });

                setDepartments(deptData || []);
            } catch (err) {
                showError("Failed to load data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    // 🔹 Handle change
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // 🔹 Submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            if (!id) return;

            await apiFetch(`/equipment/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            navigate("/equipment");
        } catch (err) {
            showError("Failed to update equipment");
        }
    }

    if (loading) {
        return (
            <Layout>
                <div style={{ padding: "20px" }}>Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                {/* 🔙 Back Button */}
                <button
                    onClick={() => navigate("/equipment")}
                    style={{
                        marginBottom: "12px",
                        background: "transparent",
                        border: "none",
                        color: "#4f46e5",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    ← Back to Equipment
                </button>

                <h1>Edit Equipment</h1>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                    Update device information in your inventory
                </p>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: "#fff",
                        padding: "20px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    <input
                        name="asset_tag"
                        placeholder="Asset Tag"
                        value={form.asset_tag}
                        onChange={handleChange}
                    />

                    <input
                        name="equipment_name"
                        placeholder="Equipment Name"
                        value={form.equipment_name}
                        onChange={handleChange}
                    />

                    <select
                        name="ownership_type"
                        value={form.ownership_type}
                        onChange={handleChange}
                    >
                        <option value="Owned">Owned</option>
                        <option value="Leased">Leased</option>
                    </select>

                    <input
                        name="serial_number"
                        placeholder="Serial Number"
                        value={form.serial_number}
                        onChange={handleChange}
                    />

                    <input
                        name="manufacturer"
                        placeholder="Manufacturer"
                        value={form.manufacturer}
                        onChange={handleChange}
                    />

                    <input
                        name="model"
                        placeholder="Model (Optional)"
                        value={form.model}
                        onChange={handleChange}
                    />

                    {/* ✅ Department dropdown (auto-selected) */}
                    <select
                        name="department_id"
                        value={form.department_id}
                        onChange={handleChange}
                    >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        name="installation_date"
                        value={form.installation_date}
                        onChange={handleChange}
                    />

                    <input
                        name="lifecycle_years"
                        placeholder="Lifecycle Years"
                        value={form.lifecycle_years}
                        onChange={handleChange}
                    />

                    <button
                        type="submit"
                        style={{
                            marginTop: "10px",
                            padding: "12px",
                            background: "#4f46e5",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </Layout>
    );
}