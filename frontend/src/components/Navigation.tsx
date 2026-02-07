import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Navigation() {
  const auth = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Biocode</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Hide Dashboard link for viewers */}
            {!auth.isViewer() && (
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Link>
            )}
             
            {/* Hide Equipment for tech and viewer users */}
            {!auth.isTech() && !auth.isViewer() && (
              <Link
                to="/equipment"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/equipment") || location.pathname.startsWith("/equipment")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Equipment
              </Link>
            )}
            
            <Link
              to="/tickets"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/tickets") || location.pathname.startsWith("/tickets")
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              Tickets
            </Link>
            
            {/* Hide Maintenance for viewer users */}
            {!auth.isViewer() && (
              <Link
                to="/maintenance"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/maintenance")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Maintenance
              </Link>
            )}
            
            {/* Hide Departments for tech and viewer users */}
            {!auth.isTech() && !auth.isViewer() && (
              <Link
                to="/departments"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/departments")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Departments
              </Link>
            )}
            
            {/* Users link - only visible to super_admin */}
            {auth.isSuperAdmin() && (
              <Link
                to="/users"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/users")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Users
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 hidden sm:block">
              <span className="font-medium">{auth.user?.full_name}</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {auth.user?.role.replace("_", " ")}
              </span>
            </div>
            <button
              onClick={auth.logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
