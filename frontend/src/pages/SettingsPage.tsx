import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { apiFetch } from "../lib/api";
import { showError, showSuccess } from "../lib/notifications";
import { useAuth } from "../lib/auth";

type UserPreferences = {
  default_view_mode: "table" | "horizontal" | "grid";
  sidebar_collapsed: boolean;
};

export function SettingsPage() {
  const auth = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_view_mode: "horizontal",
    sidebar_collapsed: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<UserPreferences>("/users/me/preferences");
      setPreferences(data);
      // Also save to localStorage for immediate use
      localStorage.setItem("userPreferences", JSON.stringify(data));
    } catch (e: any) {
      // If preferences don't exist yet, use defaults
      console.log("Using default preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      
      // Save to localStorage for immediate use
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      
      // Apply sidebar preference immediately
      localStorage.setItem("sidebarCollapsed", preferences.sidebar_collapsed.toString());
      window.dispatchEvent(new Event("sidebarPreferenceChanged"));
      
      showSuccess("Settings Saved!", "Your preferences have been updated successfully");
    } catch (e: any) {
      showError("Failed to Save Settings", e?.message ?? "Unable to save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Customize your experience</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {auth.user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{auth.user?.full_name}</h2>
                  <p className="text-gray-600">{auth.user?.email}</p>
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    {auth.user?.role.replace("_", " ").toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Display Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Display Preferences
              </h2>

              {/* Default View Mode */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Default View Mode
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how you want to view lists (tickets, equipment, etc.) by default
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Table View */}
                  <button
                    onClick={() => setPreferences({ ...preferences, default_view_mode: "table" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      preferences.default_view_mode === "table"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg className={`w-8 h-8 ${preferences.default_view_mode === "table" ? "text-purple-600" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className={`font-medium ${preferences.default_view_mode === "table" ? "text-purple-700" : "text-gray-700"}`}>
                        Table View
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        Compact rows with columns
                      </span>
                    </div>
                  </button>

                  {/* Horizontal Cards */}
                  <button
                    onClick={() => setPreferences({ ...preferences, default_view_mode: "horizontal" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      preferences.default_view_mode === "horizontal"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg className={`w-8 h-8 ${preferences.default_view_mode === "horizontal" ? "text-purple-600" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className={`font-medium ${preferences.default_view_mode === "horizontal" ? "text-purple-700" : "text-gray-700"}`}>
                        Card View
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        Horizontal cards with details
                      </span>
                    </div>
                  </button>

                  {/* Grid View */}
                  <button
                    onClick={() => setPreferences({ ...preferences, default_view_mode: "grid" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      preferences.default_view_mode === "grid"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg className={`w-8 h-8 ${preferences.default_view_mode === "grid" ? "text-purple-600" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className={`font-medium ${preferences.default_view_mode === "grid" ? "text-purple-700" : "text-gray-700"}`}>
                        Grid View
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        Compact grid layout
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sidebar Preference */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Navigation Sidebar
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Set the default state of the navigation sidebar
                </p>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Start with sidebar collapsed</p>
                      <p className="text-sm text-gray-500">Sidebar will be minimized when you open the app</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreferences({ ...preferences, sidebar_collapsed: !preferences.sidebar_collapsed })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.sidebar_collapsed ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.sidebar_collapsed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => loadPreferences()}
                disabled={saving}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
