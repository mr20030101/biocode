import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Layout } from "../components/Layout"
import { apiFetch } from "../lib/api"
import { showError } from "../lib/notifications"

type Equipment = {
    id: string
    asset_tag?: string
    equipment_name?: string
    serial_number?: string
    manufacturer?: string
    status?: string
}

// ✅ FRONTEND FORMAT
type ServiceLog = {
    id: string
    date_of_service: string
    work_done: string
    assigned_engineer: string
}

// ✅ BACKEND FORMAT
type ServiceLogAPI = {
    id: string
    date: string
    work_done: string
    engineer: string
}

export function EquipmentDetailsPage() {

    const { id } = useParams()
    const navigate = useNavigate()

    const [equipment, setEquipment] = useState<Equipment | null>(null)
    const [history, setHistory] = useState<ServiceLog[]>([])
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        date_of_service: "",
        work_done: "",
        assigned_engineer: ""
    })

    useEffect(() => {
        if (!id) return
        loadEquipment()
        loadHistory()
    }, [id])

    const loadEquipment = async () => {
        try {
            const data = await apiFetch<Equipment>(`/equipment/${id}`)
            setEquipment(data)
        } catch (e: any) {
            showError("Failed to load equipment", e?.message)
        } finally {
            setLoading(false)
        }
    }

    const loadHistory = async () => {
        try {
            const data = await apiFetch<ServiceLogAPI[]>(`/equipment/${id}/history`)

            const mapped = (data ?? []).map(item => ({
                id: item.id,
                date_of_service: item.date,
                work_done: item.work_done,
                assigned_engineer: item.engineer
            }))

            setHistory(mapped)
        } catch {
            setHistory([])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async () => {
        if (!id) return

        try {
            await apiFetch(`/equipment/${id}/history`, {
                method: "POST",
                body: JSON.stringify({
                    date: formData.date_of_service,
                    work_done: formData.work_done,
                    engineer: formData.assigned_engineer,
                }),
            })

            await loadHistory()

            setFormData({
                date_of_service: "",
                work_done: "",
                assigned_engineer: ""
            })

            setShowModal(false)

        } catch (e: any) {
            showError("Failed to save service record", e?.message)
        }
    }

    // ✅ EDIT
    const handleEdit = async (log: ServiceLog) => {
        const newWork = prompt("Edit work done:", log.work_done)
        if (!newWork) return

        try {
            await apiFetch(`/equipment/history/${log.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    work_done: newWork
                }),
            })

            await loadHistory()
        } catch (err) {
            showError("Failed to update history")
        }
    }

    // ✅ DELETE
    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return

        try {
            await apiFetch(`/equipment/history/${id}`, {
                method: "DELETE",
            })

            await loadHistory()
        } catch (err) {
            showError("Failed to delete history")
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="p-6">Loading equipment...</div>
            </Layout>
        )
    }

    return (
        <Layout>

            <div className="mx-auto py-8 px-4 max-w-4xl">

                <button
                    type="button"
                    onClick={() => navigate("/equipment")}
                    className="mb-4 text-sm text-blue-600 hover:underline"
                >
                    ← Back to Equipment
                </button>

                {equipment && (
                    <div className="bg-white shadow rounded-lg p-6 mb-6">

                        <h1 className="text-xl font-bold mb-4">
                            {equipment.equipment_name}
                        </h1>

                        <div className="grid grid-cols-2 gap-4 text-sm">

                            <div>
                                <div className="text-gray-500">Asset Tag</div>
                                <div>{equipment.asset_tag ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-gray-500">Serial Number</div>
                                <div>{equipment.serial_number ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-gray-500">Manufacturer</div>
                                <div>{equipment.manufacturer ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-gray-500">Status</div>
                                <div>{equipment.status ?? "-"}</div>
                            </div>

                        </div>

                        <div className="flex gap-2 mt-6">

                            <button
                                type="button"
                                onClick={() => navigate(`/equipment/${equipment.id}/edit`)}
                                className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
                            >
                                Edit Equipment
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(`/tickets/new?equipment_id=${equipment.id}`)}
                                className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
                            >
                                Create Ticket
                            </button>

                        </div>

                    </div>
                )}

                <div className="bg-white shadow rounded-lg p-6">

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">
                            Service History
                        </h2>

                        <button
                            onClick={() => setShowModal(true)}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            + Add Service Record
                        </button>
                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Work Done</th>
                                    <th className="text-left py-2">Engineer</th>
                                    <th className="text-left py-2">Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">
                                            No service records yet
                                        </td>
                                    </tr>
                                )}

                                {history.map(log => (
                                    <tr key={log.id} className="border-b">
                                        <td className="py-2">{log.date_of_service}</td>
                                        <td className="py-2">{log.work_done}</td>
                                        <td className="py-2">{log.assigned_engineer}</td>
                                        <td className="py-2 flex gap-2">
                                            <button onClick={() => handleEdit(log)}>✏️</button>
                                            <button onClick={() => handleDelete(log.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white p-6 rounded shadow w-full max-w-md">

                            <h3 className="text-lg font-bold mb-4">
                                Add Service Record
                            </h3>

                            <input
                                type="date"
                                name="date_of_service"
                                value={formData.date_of_service}
                                onChange={handleChange}
                                className="w-full mb-3 border p-2 rounded"
                            />

                            <textarea
                                name="work_done"
                                placeholder="Work Done"
                                value={formData.work_done}
                                onChange={handleChange}
                                className="w-full mb-3 border p-2 rounded"
                            />

                            <input
                                type="text"
                                name="assigned_engineer"
                                placeholder="Engineer"
                                value={formData.assigned_engineer}
                                onChange={handleChange}
                                className="w-full mb-4 border p-2 rounded"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-3 py-2 border rounded"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="px-3 py-2 bg-blue-600 text-white rounded"
                                >
                                    Save
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>

        </Layout>
    )
}