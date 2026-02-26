"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    }
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