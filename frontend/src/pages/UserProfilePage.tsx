import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type UserStats = {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    department_id?: string | null;
  };
  summary: {
    total_assigned: number;
    total_resolved: number;
    total_closed: number;
    in_progress: number;
    open: number;
    completion_rate: number;
  };
};

type Department = {
  id: string;
  name: string;
  code?: string | null;
};

type Ticket = {
  id: string;
  ticket_code: string;
  title?: string | null;
  status: string;
  priority?: string | null;
  created_at: string;
  equipment_id?: string | null;
};

type MaintenanceSchedule = {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  next_maintenance_date: string;
  is_active: boolean;
  notes?: string | null;
};

type Equipment = {
  id: string;
  device_name: string;
  asset_tag: string;
};

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const auth = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    loadUserStats();
  }, [id]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<UserStats>(`/auth/users/${id}/stats`);
      setStats(data);
      
      // Load department if user has one
      if (data.user.department_id) {
        try {
          const deptData = await apiFetch<Department>(`/departments/${data.user.department_id}`);
          setDepartment(deptData);
        } catch (e) {
          console.error("Failed to load department:", e);
        }
      }
      
      // Only load tickets for non-tech users or if super_admin is viewing
      const isTechUser = data.user.role === 'tech';
      const isViewingOwnProfile = auth.user?.id === id;
      
      if (!isTechUser || !isViewingOwnProfile) {
        // Load tickets assigned to this user
        try {
          const assignedResponse = await apiFetch<any>(`/tickets/?assigned_to_user_id=${id}&page_size=100`);
          setAssignedTickets(assignedResponse.items || assignedResponse);
        } catch (e) {
          console.error("Failed to load assigned tickets:", e);
        }
        
        // Load tickets created by this user
        try {
          const createdResponse = await apiFetch<any>(`/tickets/?page_size=1000`);
          const allTickets = createdResponse.items || createdResponse;
          // Filter tickets created by this user
          setCreatedTickets(allTickets.filter((t: any) => t.reported_by_user_id === id));
        } catch (e) {
          console.error("Failed to load created tickets:", e);
        }
      }
      
      // Load maintenance schedules assigned to this user
      try {
        const maintenanceResponse = await apiFetch<any>(`/maintenance/?page_size=1000`);
        const allMaintenance = maintenanceResponse.items || maintenanceResponse;
        setMaintenanceSchedules(allMaintenance.filter((m: any) => m.assigned_to_user_id === id && m.is_active));
      } catch (e) {
        console.error("Failed to load maintenance schedules:", e);
      }
      
      // Load equipment for reference
      try {
        const equipmentResponse = await apiFetch<any>(`/equipment/?page_size=1000`);
        setEquipment(equipmentResponse.items || equipmentResponse);
      } catch (e) {
        console.error("Failed to load equipment:", e);
      }
      
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-700";
      case "supervisor":
        return "bg-blue-100 text-blue-700";
      case "tech":
        return "bg-green-100 text-green-700";
      case "viewer":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Check access: super_admin can view any profile, tech users can view their own
  const canViewProfile = auth.isSuperAdmin() || (auth.user?.id === id && auth.user?.role === 'tech');
  
  if (!canViewProfile) {
    return (
      <Layout>
        <div className="mx-auto py-8">
          <div className="card">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="mt-2 text-sm text-gray-500">
                You can only view your own profile.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto py-8">
          <div className="text-center py-12 text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="mx-auto py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error || "Failed to load user statistics"}
          </div>
          <button onClick={() => nav("/users")} className="btn-secondary">
            Back to Users
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {auth.isSuperAdmin() ? (
            <button
              onClick={() => nav("/users")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Users
            </button>
          ) : (
            <button
              onClick={() => nav("/")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          )}
        </div>

        {/* User Info Card */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {stats.user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{stats.user.full_name}</h1>
              <p className="text-gray-600 mt-1">{stats.user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                    stats.user.role
                  )}`}
                >
                  {stats.user.role.replace("_", " ")}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    stats.user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {stats.user.is_active ? "Active" : "Inactive"}
                </span>
                {department && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                    {department.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Assigned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.summary.total_assigned}
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
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.summary.total_resolved}
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
                <p className="text-sm text-gray-500">Closed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.summary.total_closed}
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
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.summary.in_progress}
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
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.summary.open}</p>
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
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.summary.completion_rate}%
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

        {/* Assigned Tickets Section */}
        {assignedTickets.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Assigned Tickets ({assignedTickets.length})
            </h2>
            <div className="space-y-3">
              {assignedTickets.slice(0, 10).map((ticket) => {
                const eq = equipment.find(e => e.id === ticket.equipment_id);
                return (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{ticket.ticket_code}</span>
                        {ticket.priority && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ticket.title || 'No title'}</p>
                      {eq && (
                        <p className="text-xs text-gray-500 mt-1">Equipment: {eq.device_name} ({eq.asset_tag})</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4 ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
              {assignedTickets.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  Showing 10 of {assignedTickets.length} assigned tickets
                </p>
              )}
            </div>
          </div>
        )}

        {/* Created Tickets Section */}
        {createdTickets.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Created Tickets ({createdTickets.length})
            </h2>
            <div className="space-y-3">
              {createdTickets.slice(0, 10).map((ticket) => {
                const eq = equipment.find(e => e.id === ticket.equipment_id);
                return (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{ticket.ticket_code}</span>
                        {ticket.priority && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ticket.title || 'No title'}</p>
                      {eq && (
                        <p className="text-xs text-gray-500 mt-1">Equipment: {eq.device_name} ({eq.asset_tag})</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4 ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
              {createdTickets.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  Showing 10 of {createdTickets.length} created tickets
                </p>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Schedules Section */}
        {maintenanceSchedules.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Assigned Maintenance Schedules ({maintenanceSchedules.length})
            </h2>
            <div className="space-y-3">
              {maintenanceSchedules.map((schedule) => {
                const eq = equipment.find(e => e.id === schedule.equipment_id);
                const nextDate = new Date(schedule.next_maintenance_date);
                const now = new Date();
                const isOverdue = nextDate < now;
                const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {eq?.device_name || 'Unknown Equipment'}
                      </p>
                      {eq && (
                        <p className="text-xs text-gray-500 mt-1">Asset Tag: {eq.asset_tag}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1 capitalize">
                        {schedule.maintenance_type.replace('_', ' ')}
                      </p>
                      {schedule.notes && (
                        <p className="text-xs text-gray-500 mt-1">{schedule.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Next: {nextDate.toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4 ${
                      isOverdue ? 'bg-red-100 text-red-700' :
                      daysUntil <= 7 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {isOverdue ? `Overdue ${Math.abs(daysUntil)}d` :
                       daysUntil === 0 ? 'Due today' :
                       daysUntil === 1 ? 'Due tomorrow' :
                       `${daysUntil} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Activity Message */}
        {assignedTickets.length === 0 && createdTickets.length === 0 && maintenanceSchedules.length === 0 && (
          <div className="card">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No tickets or maintenance schedules assigned to this user</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
