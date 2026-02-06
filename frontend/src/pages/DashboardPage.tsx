import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Equipment = {
  id: string;
  asset_tag: string;
  device_name: string;
  manufacturer?: string | null;
  model?: string | null;
  status: string;
  department_id?: string | null;
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

export function DashboardPage() {
  const auth = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techStats, setTechStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isTech = auth.user?.role === "tech";

  useEffect(() => {
    loadDashboardData();
  }, [auth.user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isTech && auth.user?.id) {
        // Load tech-specific stats
        const [ticketsData, statsData] = await Promise.all([
          apiFetch<Ticket[]>("/tickets/"),
          apiFetch<UserStats>(`/auth/users/${auth.user.id}/stats`),
        ]);
        setTickets(ticketsData);
        setTechStats(statsData);
      } else {
        // Load general dashboard for other roles
        const [equipmentData, ticketsData] = await Promise.all([
          apiFetch<Equipment[]>("/equipment/"),
          apiFetch<Ticket[]>("/tickets/"),
        ]);
        setEquipment(equipmentData);
        setTickets(ticketsData);
      }
    } catch (e: any) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const activeEquipment = equipment.filter((e) => e.status === "active").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;

  // Tech Dashboard View
  if (isTech && techStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* User Info Card */}
              <div className="card mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {techStats.user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{techStats.user.full_name}</h2>
                    <p className="text-gray-600">{techStats.user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        tech
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.total_assigned}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.total_resolved}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Closed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.total_closed}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.in_progress}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.open}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {techStats.summary.completion_rate}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 gap-6">
                {/* Recent Tickets */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
                    <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View all →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((t) => (
                      <Link
                        key={t.id}
                        to={`/tickets/${t.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{t.title}</p>
                          <p className="text-sm text-gray-500">
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

                {/* Monthly Performance Report */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Monthly Performance Report
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">Last 12 months of ticket activity</p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Month
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fixed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {techStats.monthly_stats.map((month, index) => {
                          const rate =
                            month.assigned > 0
                              ? Math.round((month.resolved / month.assigned) * 100)
                              : 0;
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {month.month} {month.year}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                                  {month.assigned}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                                  {month.resolved}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        rate >= 80
                                          ? "bg-green-500"
                                          : rate >= 50
                                          ? "bg-orange-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${rate}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // General Dashboard View (for non-tech users)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{equipment.length}</p>
                    <p className="text-sm text-gray-500 mt-1">{activeEquipment} active</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{tickets.length}</p>
                    <p className="text-sm text-gray-500 mt-1">{openTickets} open</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{openTickets}</p>
                    <p className="text-sm text-gray-500 mt-1">Needs attention</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{inProgressTickets}</p>
                    <p className="text-sm text-gray-500 mt-1">Being worked on</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Equipment */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Equipment</h2>
                  <Link to="/equipment" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {equipment.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{e.device_name}</p>
                        <p className="text-sm text-gray-500">Asset: {e.asset_tag}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        e.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                  {!equipment.length && (
                    <p className="text-sm text-gray-500 text-center py-8">No equipment yet.</p>
                  )}
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
                  <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-sm text-gray-500">
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
    </div>
  );
}

