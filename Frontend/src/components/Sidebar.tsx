"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && localStorage.getItem("theme") === "dark") {
      return "dark";
    }
    return "light";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const handleProfile = () => {
    setUserMenuOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserMenuOpen(false);
    router.replace("/login");
  };

  const navItems = user?.isAdmin
    ? [
        { href: "/dashboard/admin", label: "Admin Home", icon: "A" },
        { href: "/dashboard/admin/users", label: "Users", icon: "U" },
        { href: "/dashboard/admin/classes", label: "Classes", icon: "C" },
        { href: "/dashboard/admin/teachers", label: "Teachers", icon: "T" },
        { href: "/dashboard/admin/rooms", label: "Rooms", icon: "R" },
        { href: "/dashboard/admin/cameras", label: "Cameras", icon: "M" },
        { href: "/dashboard/admin/sessions", label: "Sessions", icon: "X" },
      ]
    : [{ href: "/dashboard", label: "Dashboard", icon: "D" }];

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
            {user?.isAdmin ? "Admin" : "Dashboard"}
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
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
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
      {/* User menu */}
      <div className="mt-auto relative">
        <button
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className="w-full flex items-center rounded p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <UserCircle2 size={20} />
          {!collapsed && <span className="ml-3 font-medium">Account</span>}
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-12 left-0 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-20">
            <button
              onClick={handleProfile}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User size={16} />
              <span>Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
