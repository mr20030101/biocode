import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NotificationBell } from "./NotificationBell";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const auth = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    // Listen for preference changes from settings page
    const handlePreferenceChange = () => {
      const saved = localStorage.getItem("sidebarCollapsed");
      setIsCollapsed(saved === "true");
    };

    window.addEventListener("sidebarPreferenceChanged", handlePreferenceChange);
    return () => window.removeEventListener("sidebarPreferenceChanged", handlePreferenceChange);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      show: !auth.isViewer(),
    },
    {
      path: "/equipment",
      label: "Equipment",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      show: !auth.isTech() && !auth.isViewer(),
    },
    {
      path: "/tickets",
      label: "Tickets",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      show: true,
    },
    {
      path: "/maintenance",
      label: "Maintenance",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      show: !auth.isViewer(),
    },
    {
      path: "/departments",
      label: "Departments",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      show: !auth.isTech() && !auth.isViewer(),
    },
    {
      path: "/reports",
      label: "Reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      show: auth.isSupervisorOrAbove(),
    },
    {
      path: "/users",
      label: "Users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      show: auth.isSuperAdmin(),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header Navigation */}
      <header className={`fixed mt-2.5 mr-2.5 top-0 right-0 transition-all duration-300 ${isCollapsed ? "left-[calc(8%+1rem)]" : "left-[calc(20%+1rem)]"} h-16 z-40`}>
        <div className="h-full px-6 py-4 rounded-2xl shadow-sm bg-white flex items-center justify-between gap-4">
          {/* Page Title */}
          <div className="flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {location.pathname === "/" ? "Dashboard" : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2).replace(/-/g, " ")}
            </h2>
          </div>

          {/* Right Side - Notifications & User */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Notifications */}
            <NotificationBell />

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Settings */}
            <Link
              to="/settings"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* User Avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
              {auth.user?.full_name?.charAt(0).toUpperCase()}
            </div>

            {/* User Info - Hidden on smaller screens */}
            <div className="hidden xl:block min-w-0 max-w-[200px]">
              <p className="text-sm font-semibold text-gray-900 truncate">{auth.user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{auth.user?.role.replace("_", " ")}</p>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={auth.logout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed left-0 top-0 transition-all duration-300 h-screen ${
            isCollapsed ? "w-[8%]" : "w-[20%]"
          } p-4 flex-shrink-0 z-50`}
        >
        <nav className="h-full backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className={`p-6 border-b border-white/20 ${isCollapsed ? "flex justify-center" : ""}`}>
            <Link to="/" className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Biocode
                  </span>
                  <span className="text-xs text-gray-500">Management System</span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map(
              (item) =>
                item.show && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center ${isCollapsed ? "justify-center px-2" : "space-x-3 px-4"} py-3 rounded-xl transition-all duration-200 group ${
                      isActive(item.path) || location.pathname.startsWith(item.path + "/")
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-white/50 hover:shadow-md"
                    }`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <span className={isActive(item.path) || location.pathname.startsWith(item.path + "/") ? "" : "group-hover:scale-110 transition-transform"}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </Link>
                )
            )}
          </div>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={toggleSidebar}
              className={`w-full px-3 py-2 text-sm font-medium text-gray-600 bg-white/50 rounded-lg hover:bg-white/70 transition-colors flex items-center justify-center ${isCollapsed ? "" : "space-x-2"}`}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!isCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </nav>
      </aside>

        {/* Spacer to account for fixed sidebar */}
        <div className={`transition-all duration-300 flex-shrink-0 ${isCollapsed ? "w-[8%]" : "w-[20%]"}`} />

        {/* Main Content Area - Fixed container with scrollable content */}
        <main className="flex-1 transition-all duration-300 h-screen overflow-hidden flex flex-col">
          {/* Content wrapper - scrollable */}
          <div className="flex-1 overflow-y-auto pt-20 px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
