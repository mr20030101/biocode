import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../lib/api";
import { showError, showSuccess, showConfirm } from "../lib/notifications";
import { useNotifications } from "../lib/notificationContext";

type Notification = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export function NotificationsPage() {
  const { refreshUnreadCount, decrementUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [page, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const unreadOnly = filter === "unread";
      const data = await apiFetch<{
        items: Notification[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      }>(`/notifications/?page=${page}&page_size=20&unread_only=${unreadOnly}`);
      
      setNotifications(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (e: any) {
      showError('Failed to Load Notifications', e?.message ?? "Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/notifications/${notificationId}/mark-read`, { method: "POST" });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
      decrementUnreadCount();
    } catch (e: any) {
      showError('Failed to Mark as Read', e?.message ?? "Unable to mark notification as read.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch("/notifications/mark-all-read", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      await refreshUnreadCount();
      showSuccess('All Marked as Read!', 'All notifications have been marked as read');
    } catch (e: any) {
      showError('Failed to Mark All as Read', e?.message ?? "Unable to mark all notifications as read.");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const result = await showConfirm(
      'Delete Notification?',
      'Are you sure you want to delete this notification? This action cannot be undone.',
      'Yes, delete it',
      'Cancel'
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await apiFetch(`/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setTotal(total - 1);
      await refreshUnreadCount();
      showSuccess('Notification Deleted!', 'Notification has been deleted successfully');
    } catch (e: any) {
      showError('Failed to Delete Notification', e?.message ?? "Unable to delete notification.");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ticket_assigned":
      case "ticket_updated":
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        );
      case "maintenance_due":
      case "maintenance_overdue":
        return (
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "equipment_status":
        return (
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {total} total {unreadCount > 0 && `• ${unreadCount} unread`}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Mark All Read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === "unread" ? "You have no unread notifications" : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                    !notification.is_read
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {getNotificationIcon(notification.notification_type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-gray-700 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDateTime(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={20}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
