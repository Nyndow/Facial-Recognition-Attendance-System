"use client";

import { useSessions } from "@/hooks/useSessions";
import Protected from "@/components/Protected";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function DashboardPage() {
  const { sessions, loading } = useSessions();
  const router = useRouter();

  const handleClick = (sessionId: number) => {
    router.push(`/dashboard/sessionInfo?sessionId=${sessionId}`);
  };

  return (
    <Protected>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Today's Sessions</h1>

        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No sessions found.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleClick(session.id)}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">{session.subject}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  Class: {session.class_name || "N/A"}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  Room: {session.room}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  Teacher: {session.teacher_name || "N/A"}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Time: {format(new Date(session.time), "PPPp")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}