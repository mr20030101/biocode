import React, { createContext, useContext, useMemo, useState } from "react";

import { apiFetch, login as apiLogin, setToken } from "./api";

type UserRole = "super_admin" | "manager" | "department_head" | "support" | "department_incharge";

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
  isManager: () => boolean;
  isManagerOrAbove: () => boolean;
  isDepartmentHead: () => boolean;
  isDepartmentHeadOrAbove: () => boolean;
  isSupport: () => boolean;
  isDepartmentIncharge: () => boolean;
  canCloseTickets: () => boolean;
  canUpdateEquipmentStatus: () => boolean;
  canCreateEquipment: () => boolean;
  canManageDepartments: () => boolean;
  canViewAllTickets: () => boolean;
  // Legacy compatibility
  isSupervisor: () => boolean;
  isSupervisorOrAbove: () => boolean;
  isTech: () => boolean;
  isViewer: () => boolean;
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
  const isManager = () => user?.role === "manager";
  const isManagerOrAbove = () => user?.role === "super_admin" || user?.role === "manager";
  const isDepartmentHead = () => user?.role === "department_head";
  const isDepartmentHeadOrAbove = () => user?.role === "super_admin" || user?.role === "manager" || user?.role === "department_head";
  const isSupport = () => user?.role === "support";
  const isDepartmentIncharge = () => user?.role === "department_incharge";
  
  // Legacy compatibility
  const isSupervisor = () => isManager();
  const isSupervisorOrAbove = () => isManagerOrAbove();
  const isTech = () => isSupport();
  const isViewer = () => isDepartmentIncharge();
  
  const canCloseTickets = () => isManagerOrAbove();
  const canUpdateEquipmentStatus = () => isDepartmentHeadOrAbove();
  const canCreateEquipment = () => isDepartmentHeadOrAbove();
  const canManageDepartments = () => isSuperAdmin();
  const canViewAllTickets = () => isManagerOrAbove();

  const value = useMemo(
    () => ({ 
      user, 
      loading, 
      refreshMe, 
      login, 
      logout,
      isSuperAdmin,
      isManager,
      isManagerOrAbove,
      isDepartmentHead,
      isDepartmentHeadOrAbove,
      isSupport,
      isDepartmentIncharge,
      canCloseTickets,
      canUpdateEquipmentStatus,
      canCreateEquipment,
      canManageDepartments,
      canViewAllTickets,
      // Legacy compatibility
      isSupervisor,
      isSupervisorOrAbove,
      isTech,
      isViewer,
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

