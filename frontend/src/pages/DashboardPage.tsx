import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  manufacturer?: string | null;
  model?: string | null;
  status: string;
  department_id?: string | null;
  repair_count: number;
};

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  created_at: string;
};

type UserStats = {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  summary: {
    total_assigned: number;
    total_resolved: number;
    total_closed: number;
    in_progress: number;
    open: number;
    completion_rate: number;
  };
  monthly_stats: Array<{
    month: string;
    year: number;
    resolved: number;
    assigned: number;
  }>;
};

type DepartmentRepairs = {
  department_id: string;
  department_name: string;
  department_code: string | null;
  total_repairs: number;
  equipment_count: number;
  tickets_resolved: number;
  avg_repairs_per_equipment: number;
};

const COLORS = {
  blue: "#3B82F6",
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
  gray: "#6B7280",
  lightBlue: "#93C5FD",
  lightGreen: "#86EFAC",
  lightOrange: "#FCD34D",
  lightRed: "#FCA5A5",
};

export function DashboardPage() {
  const auth = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techStats, setTechStats] = useState<UserStats | null>(null);
  const [departmentRepairs, setDepartmentRepairs] = useState<DepartmentRepairs[]>([]);
  const [loading, setLoading] = useState(true);

  const isTech = auth.user?.role === "tech";

  useEffect(() => {
    loadDashboardData();
  }, [auth.user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isTech && auth.user?.id) {
        const [ticketsData, statsData] = await Promise.all([
          apiFetch<any>("/tickets/"),
          apiFetch<UserStats>(`/auth/users/${auth.user.id}/stats`),
        ]);
        setTickets(ticketsData.items || ticketsData);
        setTechStats(statsData);
      } else {
        const [equipmentData, ticketsData, deptRepairsData] = await Promise.all([
          apiFetch<any>("/equipment/"),
          apiFetch<any>("/tickets/"),
          apiFetch<DepartmentRepairs[]>("/analytics/departments/repairs"),
        ]);
        setEquipment(equipmentData.items || equipmentData);
        setTickets(ticketsData.items || ticketsData);
        setDepartmentRepairs(deptRepairsData);
      }
    } catch (e: any) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const activeEquipment = equipment.filter((e) => e.status === "active").length;
  const outOfServiceEquipment = equipment.filter((e) => e.status === "out_of_service").length;
  const retiredEquipment = equipment.filter((e) => e.status === "retired").length;
  
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
  const closedTickets = tickets.filter((t) => t.status === "closed").length;
  
  const highPriorityTickets = tickets.filter((t) => t.priority === "high").length;
  const mediumPriorityTickets = tickets.filter((t) => t.priority === "medium").length;
  const lowPriorityTickets = tickets.filter((t) => t.priority === "low").length;

  // Equipment with most repairs
  const topRepairEquipment = [...equipment]
    .sort((a, b) => b.repair_count - a.repair_count)
    .slice(0, 5);

  // Chart.js configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#FFF',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
  };

  // Equipment Status Pie Chart Data
  const equipmentStatusChartData = {
    labels: ['Active', 'Out of Service', 'Retired'],
    datasets: [
      {
        data: [activeEquipment, outOfServiceEquipment, retiredEquipment],
        backgroundColor: [COLORS.green, COLORS.orange, COLORS.gray],
        borderWidth: 2,
        borderColor: '#FFF',
      },
    ],
  };

  // Ticket Status Pie Chart Data
  const ticketStatusChartData = {
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [openTickets, inProgressTickets, resolvedTickets, closedTickets],
        backgroundColor: [COLORS.blue, COLORS.orange, COLORS.green, COLORS.gray],
        borderWidth: 2,
        borderColor: '#FFF',
      },
    ],
  };

  // Ticket Priority Pie Chart Data
  const ticketPriorityChartData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [highPriorityTickets, mediumPriorityTickets, lowPriorityTickets],
        backgroundColor: [COLORS.red, COLORS.orange, COLORS.green],
        borderWidth: 2,
        borderColor: '#FFF',
      },
    ],
  };

  // Equipment Repairs Bar Chart Data
  const equipmentRepairsChartData = {
    labels: topRepairEquipment.map(e => 
      e.device_name.length > 20 ? e.device_name.substring(0, 20) + "..." : e.device_name
    ),
    datasets: [
      {
        label: 'Repairs',
        data: topRepairEquipment.map(e => e.repair_count),
        backgroundColor: COLORS.red,
        borderRadius: 8,
      },
    ],
  };

  // Department Repairs Bar Chart Data
  const departmentRepairsChartData = {
    labels: departmentRepairs.map(d => d.department_name),
    datasets: [
      {
        label: 'Total Repairs',
        data: departmentRepairs.map(d => d.total_repairs),
        backgroundColor: COLORS.blue,
        borderRadius: 8,
      },
      {
        label: 'Tickets Resolved',
        data: departmentRepairs.map(d => d.tickets_resolved),
        backgroundColor: COLORS.green,
        borderRadius: 8,
      },
    ],
  };

  // Tech Dashboard View
  if (isTech && techStats) {
    const monthlyChartData = {
      labels: techStats.monthly_stats.slice(-6).map(m => `${m.month.substring(0, 3)} ${m.year}`),
      datasets: [
        {
          label: 'Assigned',
          data: techStats.monthly_stats.slice(-6).map(m => m.assigned),
          borderColor: COLORS.blue,
          backgroundColor: COLORS.lightBlue,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Resolved',
          data: techStats.monthly_stats.slice(-6).map(m => m.resolved),
          borderColor: COLORS.green,
          backgroundColor: COLORS.lightGreen,
          tension: 0.4,
          fill: true,
        },
      ],
    };

    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {techStats.user.full_name}!</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Total Assigned</p>
                  <p className="text-4xl font-bold">{techStats.summary.total_assigned}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-100 mb-1">Resolved</p>
                  <p className="text-4xl font-bold">{techStats.summary.total_resolved}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Completion Rate</p>
                  <p className="text-4xl font-bold">{techStats.summary.completion_rate}%</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly Performance Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 6 Months Performance</h3>
                  <div style={{ height: '300px' }}>
                    <Line data={monthlyChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Current Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">In Progress</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{techStats.summary.in_progress}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">Open</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">{techStats.summary.open}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">Closed</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-600">{techStats.summary.total_closed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                  <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                    <span>View all</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      to={`/tickets/${t.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          t.status === "open"
                            ? "bg-blue-100 text-blue-700"
                            : t.status === "in_progress"
                            ? "bg-orange-100 text-orange-700"
                            : t.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </Link>
                  ))}
                  {!tickets.length && (
                    <p className="text-sm text-gray-500 text-center py-8">No tickets assigned yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  // General Dashboard View (for non-tech users)
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {!auth.isViewer() && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Total Equipment</p>
                  <p className="text-4xl font-bold mb-1">{equipment.length}</p>
                  <p className="text-sm text-blue-100">{activeEquipment} active</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-orange-100 mb-1">Total Tickets</p>
                <p className="text-4xl font-bold mb-1">{tickets.length}</p>
                <p className="text-sm text-orange-100">{openTickets} open</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-red-100 mb-1">Open Tickets</p>
                <p className="text-4xl font-bold mb-1">{openTickets}</p>
                <p className="text-sm text-red-100">Needs attention</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-100 mb-1">In Progress</p>
                <p className="text-4xl font-bold mb-1">{inProgressTickets}</p>
                <p className="text-sm text-green-100">Being worked on</p>
              </div>
            </div>

            {/* Charts Row */}
            {!auth.isViewer() && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Equipment Status Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status</h3>
                  <div style={{ height: '250px' }}>
                    <Pie data={equipmentStatusChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Ticket Status Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status</h3>
                  <div style={{ height: '250px' }}>
                    <Pie data={ticketStatusChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Ticket Priority Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Priority</h3>
                  <div style={{ height: '250px' }}>
                    <Pie data={ticketPriorityChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* Equipment with Most Repairs */}
            {!auth.isViewer() && topRepairEquipment.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment with Most Repairs</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={equipmentRepairsChartData} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Repairs by Department */}
            {!auth.isViewer() && departmentRepairs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repairs by Department</h3>
                <div style={{ height: '350px' }}>
                  <Bar 
                    data={departmentRepairsChartData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            afterBody: (context: any) => {
                              const index = context[0].dataIndex;
                              const dept = departmentRepairs[index];
                              return [
                                `Equipment: ${dept.equipment_count}`,
                                `Avg per Equipment: ${dept.avg_repairs_per_equipment}`,
                              ];
                            },
                          },
                        },
                      },
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Content Grid */}
            <div className={`grid grid-cols-1 ${!auth.isViewer() ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Recent Equipment */}
              {!auth.isViewer() && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Equipment</h3>
                    <Link to="/equipment" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                      <span>View all</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {equipment.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{e.device_name}</p>
                          <p className="text-sm text-gray-500 mt-1">Asset: {e.asset_tag}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          e.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : e.status === 'out_of_service'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {e.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                    {!equipment.length && (
                      <p className="text-sm text-gray-500 text-center py-8">No equipment yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Tickets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                  <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                    <span>View all</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        t.status === 'open' 
                          ? 'bg-blue-100 text-blue-700' 
                          : t.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-700'
                          : t.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                  {!tickets.length && (
                    <p className="text-sm text-gray-500 text-center py-8">No tickets yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
