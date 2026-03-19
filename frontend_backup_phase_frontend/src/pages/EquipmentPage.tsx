import { useEffect, useState, useMemo } from "react"
import { Layout } from "../components/Layout"
import { Pagination } from "../components/Pagination"
import { apiFetch } from "../lib/api"
import { useAuth } from "../lib/auth"
import { showError } from "../lib/notifications"
import { useNavigate } from "react-router-dom"

type Equipment = {
  id: string
  asset_tag?: string
  equipment_name?: string
  status?: string

  lifecycle_type?: "years" | "hours"
  lifecycle_years?: number

  remaining_operating_months?: number | null
  remaining_life_years?: number | null

  alert_level?: "healthy" | "warning" | "attention" | "critical"
  health_status?: "healthy" | "warning" | "attention" | "critical"

  risk_priority?: number
  pm_alert?: string

  department_id?: string
}

type Department = {
  id: string
  name: string
}

type PaginatedResponse = {
  items: Equipment[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export function EquipmentPage() {

  useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Equipment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const pageSize = 20

  useEffect(() => {
    loadDepartments()
    loadEquipment()
  }, [])

  useEffect(() => {
    loadEquipment()
  }, [currentPage])

  const loadDepartments = async () => {
    try {
      const data = await apiFetch<Department[]>("/departments/")
      setDepartments(data ?? [])
    } catch { }
  }

  const loadEquipment = async () => {
    try {

      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("page_size", pageSize.toString())

      const data = await apiFetch<PaginatedResponse>(
        `/equipment/?${params.toString()}`
      )

      setItems(data?.items ?? [])
      setTotalPages(data?.total_pages ?? 1)
      setTotalItems(data?.total ?? 0)

    } catch (e: any) {
      showError("Failed to Load Equipment", e?.message)
    }
  }

  const handleDelete = async (equipment: Equipment) => {

    const confirmDelete = window.confirm(
      `⚠ Delete Equipment?\n\nAsset Tag: ${equipment.asset_tag}\nName: ${equipment.equipment_name}`
    )

    if (!confirmDelete) return

    try {

      await apiFetch(`/equipment/${equipment.id}`, {
        method: "DELETE",
      })

      loadEquipment()

    } catch (e: any) {
      showError("Failed to delete equipment", e?.message)
    }
  }

  const getDepartmentName = (id?: string) => {
    if (!id) return "-"
    const dept = departments.find(d => d.id === id)
    return dept?.name ?? "-"
  }

  const calculateRiskScore = (e: Equipment) => {

    let score = 0
    const health = e.health_status ?? e.alert_level

    if (health === "critical") score += 100
    else if (health === "attention") score += 70
    else if (health === "warning") score += 40

    if (e.pm_alert === "pm_required") score += 40
    if (e.pm_alert === "no_pm_record") score += 25

    const lifeMonths = e.remaining_operating_months

    if (lifeMonths !== undefined && lifeMonths !== null) {
      if (lifeMonths <= 3) score += 50
      else if (lifeMonths <= 6) score += 30
      else if (lifeMonths <= 12) score += 10
    }

    if (e.risk_priority) {
      score += e.risk_priority * 10
    }

    return score
  }

  const sortedItems = useMemo(() => {

    let filtered = [...items]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()

      filtered = filtered.filter(e =>
        (e.equipment_name ?? "").toLowerCase().includes(term) ||
        (e.asset_tag ?? "").toLowerCase().includes(term)
      )
    }

    if (departmentFilter) {
      filtered = filtered.filter(e => e.department_id === departmentFilter)
    }

    return filtered.sort(
      (a, b) => calculateRiskScore(b) - calculateRiskScore(a)
    )

  }, [items, searchTerm, departmentFilter])

  const getRemainingLife = (e: Equipment) => {

    if (e.lifecycle_type === "years") {

      const years = e.remaining_life_years

      if (years !== undefined && years !== null) {

        if (years <= 0) return "Expired"

        return `${years.toFixed(1)} years`
      }

      return "N/A"
    }

    if (e.lifecycle_type === "hours") {

      const months = e.remaining_operating_months

      if (months !== undefined && months !== null) {

        if (months <= 0) return "Expired"

        return `${months} months`
      }

      return "N/A"
    }

    return "N/A"
  }

  return (

    <Layout>

      <div className="mx-auto py-8 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Equipment Command Center
        </h1>

        <div className="flex flex-wrap gap-3 mb-6">

          <button
            onClick={() => navigate("/equipment/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Equipment
          </button>

          <input
            type="text"
            placeholder="Search Equipment..."
            className="border rounded px-3 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

        </div>

        <div className="space-y-4">

          {sortedItems.map(e => {

            const risk = calculateRiskScore(e)
            const isHighRisk = risk > 120

            return (

              <div
                key={e.id}
                className={`flex bg-white shadow rounded-lg overflow-hidden ${isHighRisk ? "border border-red-400 shadow-red-200 shadow-lg" : ""}`}
              >

                <div className="flex justify-between p-4 w-full">

                  <div>

                    {isHighRisk && (
                      <div className="text-red-600 text-xs font-bold mb-1">
                        ⚠ High Risk Equipment
                      </div>
                    )}

                    <div className="font-bold text-lg">
                      {e.equipment_name ?? "Unknown Equipment"}
                    </div>

                    <div className="text-xs text-blue-600 mt-1">
                      📍 {getDepartmentName(e.department_id)}
                    </div>

                    <div className="text-gray-500 mt-2">
                      Asset Tag: {e.asset_tag ?? "-"}
                    </div>

                  </div>

                  <div className="text-right">

                    <div className="text-sm text-gray-500">
                      Remaining Life
                    </div>

                    <div className="font-semibold">
                      {getRemainingLife(e)}
                    </div>

                    <div className="flex gap-2 mt-3 justify-end flex-wrap">

                      <button
                        onClick={() => navigate(`/equipment/${e.id}`)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        View
                      </button>

                      <button
                        onClick={() => navigate(`/equipment/edit/${e.id}`)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(e)}
                        className="text-xs px-2 py-1 border border-red-400 text-red-600 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() => navigate(`/tickets/new?equipment_id=${e.id}`)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        Create Ticket
                      </button>

                      <button
                        onClick={() => navigate(`/maintenance/schedule?equipment_id=${e.id}`)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        Schedule PM
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            )

          })}

        </div>

        <div className="mt-6">

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
          />

        </div>

      </div>

    </Layout>

  )

}