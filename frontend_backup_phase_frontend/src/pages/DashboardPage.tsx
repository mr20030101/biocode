import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Layout } from "../components/Layout"
import { apiFetch } from "../lib/api"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"

import { Pie } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

type Equipment = {
  id: string
  asset_tag: string
  device_name: string
  manufacturer?: string | null
  model?: string | null
  status: string
  department_id?: string | null
  repair_count: number
  health_status?: string
}

type Ticket = {
  id: string
  title: string
  status: string
  priority?: string
  created_at: string
}

type EquipmentDashboardStats = {
  total_equipment: number
  healthy: number
  warning: number
  attention: number
  critical: number
  pm_overdue: number
  near_end_of_life: number
}

const COLORS = {
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444"
}

export function DashboardPage() {

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [criticalEquipment, setCriticalEquipment] = useState<Equipment[]>([])
  const [equipmentStats, setEquipmentStats] =
    useState<EquipmentDashboardStats | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {

    try {

      setLoading(true)

      const [
        equipmentData,
        ticketsData,
        dashboardStats
      ] = await Promise.all([
        apiFetch<any>("/equipment/"),
        apiFetch<any>("/tickets/"),
        apiFetch<EquipmentDashboardStats>("/equipment/dashboard")
      ])

      const equipmentList: Equipment[] =
        equipmentData.items || equipmentData

      setEquipment(equipmentList)
      setEquipmentStats(dashboardStats)

      const critical = equipmentList.filter(
        (e: any) => e.health_status === "critical"
      )

      setCriticalEquipment(critical)

      setTickets(ticketsData.items || ticketsData)

    } catch (e) {

      console.error("Dashboard load error", e)

    } finally {

      setLoading(false)

    }

  }

  const activeEquipment =
    equipment.filter(e => e.status === "active").length

  const openTickets =
    tickets.filter(t => t.status === "open").length

  const inProgressTickets =
    tickets.filter(t => t.status === "in_progress").length

  const resolvedTickets =
    tickets.filter(t => t.status === "resolved").length

  const healthyEquipment =
    equipment.filter((e: any) => e.health_status === "healthy").length

  const warningEquipment =
    equipment.filter((e: any) => e.health_status === "warning").length

  const criticalEquipmentCount =
    equipment.filter((e: any) => e.health_status === "critical").length

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  }

  const equipmentHealthChartData = {
    labels: ["Healthy", "Warning", "Critical"],
    datasets: [
      {
        data: [
          healthyEquipment,
          warningEquipment,
          criticalEquipmentCount
        ],
        backgroundColor: [
          COLORS.green,
          COLORS.orange,
          COLORS.red
        ]
      }
    ]
  }

  return (

    <Layout>

      <div className="max-w-7xl mx-auto py-8">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="text-gray-600">
            Welcome back! Here's your overview.
          </p>

        </div>

        {loading && (

          <div className="text-center py-20">
            Loading dashboard...
          </div>

        )}

        {!loading && (

          <>

            {/* COMMAND CENTER */}
            {equipmentStats && (

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">

                <div className="bg-green-500 text-white rounded-lg p-4">
                  <p className="text-sm">Healthy</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.healthy}
                  </p>
                </div>

                <div className="bg-yellow-500 text-white rounded-lg p-4">
                  <p className="text-sm">Warning</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.warning}
                  </p>
                </div>

                <div className="bg-orange-500 text-white rounded-lg p-4">
                  <p className="text-sm">Attention</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.attention}
                  </p>
                </div>

                <div className="bg-red-600 text-white rounded-lg p-4">
                  <p className="text-sm">Critical</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.critical}
                  </p>
                </div>

                <div className="bg-purple-600 text-white rounded-lg p-4">
                  <p className="text-sm">PM Overdue</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.pm_overdue}
                  </p>
                </div>

                <div className="bg-blue-600 text-white rounded-lg p-4">
                  <p className="text-sm">End of Life</p>
                  <p className="text-2xl font-bold">
                    {equipmentStats.near_end_of_life}
                  </p>
                </div>

              </div>

            )}

            {/* DASHBOARD STATS */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">
                  Total Equipment
                </p>
                <p className="text-3xl font-bold">
                  {equipment.length}
                </p>
                <p className="text-sm text-gray-500">
                  {activeEquipment} active
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">
                  Total Tickets
                </p>
                <p className="text-3xl font-bold">
                  {tickets.length}
                </p>
                <p className="text-sm text-gray-500">
                  {openTickets} open
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">
                  In Progress
                </p>
                <p className="text-3xl font-bold">
                  {inProgressTickets}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">
                  Resolved
                </p>
                <p className="text-3xl font-bold">
                  {resolvedTickets}
                </p>
              </div>

            </div>

            {/* EQUIPMENT HEALTH CHART */}

            <div className="bg-white rounded-xl shadow p-6 mb-8">

              <h3 className="text-lg font-semibold mb-4">
                Equipment Health
              </h3>

              <div style={{ height: "300px" }}>
                <Pie
                  data={equipmentHealthChartData}
                  options={chartOptions}
                />
              </div>

            </div>

            {/* CRITICAL EQUIPMENT */}

            <div className="bg-white rounded-xl shadow p-6 mb-8">

              <h3 className="text-lg font-semibold text-red-600 mb-4">
                ⚠ Critical Equipment
              </h3>

              {criticalEquipment.length === 0 && (
                <p className="text-gray-500">
                  No critical equipment detected.
                </p>
              )}

              {criticalEquipment.slice(0, 5).map(eq => (

                <div
                  key={eq.id}
                  className="flex justify-between p-3 bg-red-50 rounded mb-2"
                >

                  <div>

                    <p className="font-medium">
                      {eq.device_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Asset: {eq.asset_tag}
                    </p>

                  </div>

                  <span className="text-red-600 text-xs font-bold">
                    CRITICAL
                  </span>

                </div>

              ))}

            </div>

            {/* RECENT TICKETS */}

            <div className="bg-white rounded-xl shadow p-6">

              <div className="flex justify-between mb-4">

                <h3 className="text-lg font-semibold">
                  Recent Tickets
                </h3>

                <Link
                  to="/tickets"
                  className="text-blue-600 text-sm"
                >
                  View all
                </Link>

              </div>

              {tickets.slice(0, 5).map(t => (

                <div
                  key={t.id}
                  className="flex justify-between p-3 bg-gray-50 rounded mb-2"
                >

                  <div>

                    <p className="font-medium">
                      {t.title}
                    </p>

                    <p className="text-sm text-gray-500">
                      {new Date(t.created_at)
                        .toLocaleDateString()}
                    </p>

                  </div>

                  <span className="text-xs">
                    {t.status}
                  </span>

                </div>

              ))}

            </div>

          </>

        )}

      </div>

    </Layout>

  )

}
