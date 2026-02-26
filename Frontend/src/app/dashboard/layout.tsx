import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

interface SessionInfoLayoutProps {
  children: ReactNode;
}

export default function SessionInfoLayout({ children }: SessionInfoLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-800 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}