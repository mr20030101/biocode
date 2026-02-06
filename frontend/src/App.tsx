import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./lib/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewEquipmentPage } from "./pages/NewEquipmentPage";
import { RegisterPage } from "./pages/RegisterPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { UsersPage } from "./pages/UsersPage";
import { UserProfilePage } from "./pages/UserProfilePage";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <div className="container">Loading...</div>;
  if (!auth.user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const auth = useAuth();

  useEffect(() => {
    auth.refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/equipment"
        element={
          <RequireAuth>
            <EquipmentPage />
          </RequireAuth>
        }
      />
      <Route
        path="/equipment/new"
        element={
          <RequireAuth>
            <NewEquipmentPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tickets"
        element={
          <RequireAuth>
            <TicketsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <RequireAuth>
            <TicketDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/departments"
        element={
          <RequireAuth>
            <DepartmentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <UsersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/users/:id"
        element={
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
