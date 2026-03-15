"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  User,
  LogOut,
  Menu,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Presentation,
  DoorOpen,
  Camera,
  Video,
  VideoOff,
  CalendarClock,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useCameraStatus } from "@/hooks/useCameraStatus";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { sessions } = useSessions();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const activeSession = useMemo(() => {
    if (user?.isAdmin) return null;
    const nowTime = now.getTime();
    return (
      sessions.find((session) => {
        const start = new Date(session.time).getTime();
        const end = new Date(session.endSession).getTime();
        return nowTime >= start && nowTime <= end;
      }) ?? null
    );
  }, [now, sessions, user?.isAdmin]);

  const { cameraStatus, toggleCamera } = useCameraStatus(activeSession?.idCamera, {
    refreshKey: activeSession?.id,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleDocumentClick = () => {
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [userMenuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleNavigate = (href: string) => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    router.push(href);
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
      { href: "/dashboard/admin", label: "Admin Home", icon: <Shield size={18} /> },
      { href: "/dashboard/admin/users", label: "Users", icon: <Users size={18} /> },
      { href: "/dashboard/admin/students", label: "Students", icon: <GraduationCap size={18} /> },
      { href: "/dashboard/admin/classes", label: "Classes", icon: <BookOpen size={18} /> },
      { href: "/dashboard/admin/teachers", label: "Teachers", icon: <Presentation size={18} /> },
      { href: "/dashboard/admin/rooms", label: "Rooms", icon: <DoorOpen size={18} /> },
      { href: "/dashboard/admin/cameras", label: "Cameras", icon: <Camera size={18} /> },
      { href: "/dashboard/admin/sessions", label: "Sessions", icon: <CalendarClock size={18} /> },
    ]
    : [{ href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> }];

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-md border border-gray-200 bg-white p-2 text-gray-700 shadow-md md:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-gray-100 p-4 transition-all duration-300 dark:bg-gray-900 md:sticky md:top-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${collapsed ? "w-20" : "w-72 md:w-64"}`}
      >
        <div className="mb-6 flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {user?.isAdmin ? "Admin" : "Dashboard"}
            </h1>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 md:block"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        <hr className="mb-4 border-gray-300 dark:border-gray-700" />

        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <div

                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`mb-2 flex cursor-pointer items-center rounded p-3 transition ${isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}

              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
              </div>
            );
          })}


          {!user?.isAdmin && activeSession?.idCamera && (
            <div className="mb-4">
              <hr className="mb-4 border-gray-300 dark:border-gray-700" />
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={cameraStatus === 1 ? "Stop Camera" : "Activate Camera"}
                title={cameraStatus === 1 ? "Stop Camera" : "Activate Camera"}
                className={`rounded font-medium transition ${collapsed
                    ? "mx-auto flex h-10 w-10 items-center justify-center"
                    : "w-full px-3 py-2 text-sm"
                  } ${cameraStatus === 1
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                <span className={`flex items-center justify-center ${collapsed ? "" : "gap-2"}`}>
                  {cameraStatus === 1 ? <VideoOff size={18} /> : <Video size={18} />}
                  {!collapsed && (
                    <span>{cameraStatus === 1 ? "Stop Camera" : "Activate Camera"}</span>
                  )}
                </span>
              </button>
            </div>
          )}
        </nav>

        <div className="relative mt-auto">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setCollapsed(false);
              setUserMenuOpen((prev) => !prev);
            }}
            className="w-full rounded p-2 text-gray-700 transition hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-3"
          >
            <UserCircle2 size={20} />
            {!collapsed && <span className="font-medium">Account</span>}
          </button>

          {userMenuOpen && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="absolute bottom-12 left-0 z-20 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
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
    </>
  );
}
