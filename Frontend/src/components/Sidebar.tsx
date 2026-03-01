"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { useCameraStatus } from "@/hooks/useCameraStatus";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const parsedSessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : NaN;
  const sessionId = Number.isNaN(parsedSessionId) ? null : parsedSessionId;

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && localStorage.getItem("theme") === "dark") {
      return "dark";
    }
    return "light";
  });
  const [collapsed, setCollapsed] = useState(false);
  const { isOngoing, isActivationWindow, canToggle, socketConnected, isActive, hasCamera, loading, toggleCameraStatus } =
    useCameraStatus(sessionId);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "D" },
  ];

  return (
    <aside
      className={`flex flex-col h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top section: title + collapse + theme */}
      <div className="flex items-center justify-between mb-6">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
      

      {/* Navigation */}
      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center p-3 mb-2 rounded cursor-pointer transition
                ${isActive ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"}
              `}
            >
              <span className="font-bold">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </div>
          );
        })}
      </nav>

                 {sessionId && (
              <div className="mt-4">
                <p className="mb-2">
                  Camera:{" "}
                  {(isOngoing || isActivationWindow) && hasCamera ? (
                    <span className={isActive ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-500">
                      {hasCamera ? "No ongoing/nearby session" : "No camera"}
                    </span>
                  )}
                </p>
                <p className="mb-2 text-xs text-gray-500">
                  Socket: {socketConnected ? "Connected" : "Disconnected"}
                  {isActivationWindow ? " | Activation window (15 min)" : ""}
                </p>
                <button
                  type="button"
                  onClick={toggleCameraStatus}
                  disabled={!canToggle || !hasCamera || loading}
                  className={`w-full rounded px-3 py-2 text-sm font-medium text-white transition ${
                    !canToggle || !hasCamera || loading
                      ? "cursor-not-allowed bg-gray-400"
                      : isActive
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? "Updating..." : isActive ? "Deactivate Camera" : "Activate Camera"}
                </button>
              </div>
            )}

      {/* Status section */}
      <div className="mt-auto text-gray-600 dark:text-gray-300">
        {!collapsed && (
          <>
            <p>
              Logged in as: <span className="font-semibold">Admin</span>
            </p>
            <p>
              Status: <span className="font-semibold text-green-600">Online</span>
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
