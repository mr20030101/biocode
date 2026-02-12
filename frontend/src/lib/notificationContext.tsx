import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiFetch } from "./api";

type NotificationContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const data = await apiFetch<{ unread_count: number }>("/notifications/unread-count");
      setUnreadCount(data.unread_count);
    } catch (e) {
      // Silently fail if not authenticated or error occurs
      console.error("Failed to load unread count:", e);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const decrementUnreadCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider value={{ 
      unreadCount, 
      refreshUnreadCount: loadUnreadCount,
      decrementUnreadCount 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
