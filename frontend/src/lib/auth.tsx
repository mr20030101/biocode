import React, { createContext, useContext, useMemo, useState } from "react";

import { apiFetch, login as apiLogin, setToken } from "./api";

type UserRole = "super_admin" | "supervisor" | "tech" | "viewer";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Permission helpers
  isSuperAdmin: () => boolean;
  isSupervisor: () => boolean;
  isSupervisorOrAbove: () => boolean;
  isTech: () => boolean;
  isViewer: () => boolean;
  canCloseTickets: () => boolean;
  canUpdateEquipmentStatus: () => boolean;
  canCreateEquipment: () => boolean;
  canManageDepartments: () => boolean;
  canViewAllTickets: () => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const me = await apiFetch<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    await refreshMe();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Permission helper functions
  const isSuperAdmin = () => user?.role === "super_admin";
  const isSupervisor = () => user?.role === "supervisor";
  const isSupervisorOrAbove = () => user?.role === "super_admin" || user?.role === "supervisor";
  const isTech = () => user?.role === "tech";
  const isViewer = () => user?.role === "viewer";
  
  const canCloseTickets = () => isSupervisorOrAbove();
  const canUpdateEquipmentStatus = () => isSupervisorOrAbove();
  const canCreateEquipment = () => isSupervisorOrAbove();
  const canManageDepartments = () => isSuperAdmin();
  const canViewAllTickets = () => isSupervisorOrAbove();

  const value = useMemo(
    () => ({ 
      user, 
      loading, 
      refreshMe, 
      login, 
      logout,
      isSuperAdmin,
      isSupervisor,
      isSupervisorOrAbove,
      isTech,
      isViewer,
      canCloseTickets,
      canUpdateEquipmentStatus,
      canCreateEquipment,
      canManageDepartments,
      canViewAllTickets,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

