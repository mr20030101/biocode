import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { showError } from "../lib/notifications";

type Equipment = {
    equipment_name?: string;
    serial_number?: string;
    manufacturer?: string;
};

export function EditEquipmentPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<Equipment>({});
    const [loading, setLoading] = useState(true);

    // 🔹 Load existing equipment
    useEffect(() => {
        async function fetchData() {
            try {
                // ✅ FIX: Add generic type
                const data = await apiFetch<Equipment>(`/equipment/${id}`);
                setForm(data);
            } catch (err) {
                showError("Failed to load equipment");
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchData(); // ✅ safety check
    }, [id]);

    // 🔹 Handle input change
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    }

    // 🔹 Submit update
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            await apiFetch(`/equipment/${id}`, {
                method: "PUT",
                body: form, // ✅ works with updated api.ts
            });

            navigate(`/equipment/${id}`);
        } catch (err) {
            showError("Failed to update equipment");
        }
    }

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1>Edit Equipment</h1>

            <form onSubmit={handleSubmit}>
                <input
                    name="equipment_name"
                    placeholder="Equipment Name"
                    value={form.equipment_name || ""}
                    onChange={handleChange}
                />

                <input
                    name="serial_number"
                    placeholder="Serial Number"
                    value={form.serial_number || ""}
                    onChange={handleChange}
                />

                <input
                    name="manufacturer"
                    placeholder="Manufacturer"
                    value={form.manufacturer || ""}
                    onChange={handleChange}
                />

                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
}