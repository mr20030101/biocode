import { useState, useEffect } from "react"

type EquipmentFormProps = {
    initialData?: any
    onSubmit: (data: any) => void
    isEdit?: boolean
}

export const EquipmentForm = ({
    initialData,
    onSubmit,
    isEdit = false,
}: EquipmentFormProps) => {
    const [form, setForm] = useState({
        asset_tag: "",
        equipment_name: "",
        ownership_type: "Owned",
        serial_number: "",
        manufacturer: "",
        model: "",
        department_id: "",
        installation_date: "",
        lifecycle_years: "",
    })

    useEffect(() => {
        if (initialData) {
            setForm({
                asset_tag: initialData.asset_tag || "",
                equipment_name: initialData.equipment_name || "",
                ownership_type: initialData.ownership_type || "Owned",
                serial_number: initialData.serial_number || "",
                manufacturer: initialData.manufacturer || "",
                model: initialData.model || "",
                department_id: initialData.department_id || "",
                installation_date: initialData.installation_date || "",
                lifecycle_years: initialData.lifecycle_years || "",
            })
        }
    }, [initialData])

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: any) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4">
            <input name="asset_tag" placeholder="Asset Tag" value={form.asset_tag} onChange={handleChange} />

            <input name="equipment_name" placeholder="Equipment Name" value={form.equipment_name} onChange={handleChange} />

            <select name="ownership_type" value={form.ownership_type} onChange={handleChange}>
                <option value="Owned">Owned</option>
                <option value="Leased">Leased</option>
            </select>

            <input name="serial_number" placeholder="Serial Number" value={form.serial_number} onChange={handleChange} />

            <input name="manufacturer" placeholder="Manufacturer" value={form.manufacturer} onChange={handleChange} />

            <input name="model" placeholder="Model (Optional)" value={form.model} onChange={handleChange} />

            <input name="department_id" placeholder="Department ID" value={form.department_id} onChange={handleChange} />

            <input type="date" name="installation_date" value={form.installation_date} onChange={handleChange} />

            <input name="lifecycle_years" placeholder="Lifecycle Years" value={form.lifecycle_years} onChange={handleChange} />

            <button type="submit" className="btn btn-primary mt-3">
                {isEdit ? "Save Changes" : "Save Equipment"}
            </button>
        </form>
    )
}