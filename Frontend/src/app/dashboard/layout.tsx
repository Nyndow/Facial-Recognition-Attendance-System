import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

interface SessionInfoLayoutProps {
  children: ReactNode;
}

export default function SessionInfoLayout({ children }: SessionInfoLayoutProps) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-gray-50 p-4 pt-16 overflow-x-hidden dark:bg-slate-800 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
