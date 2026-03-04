"use client";

import { useSessions } from "@/hooks/useSessions";
import Protected from "@/components/Protected";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";

function DashboardContent() {
  const { sessions, loading } = useSessions();
  const router = useRouter();

  const handleClick = (sessionId: number) => {
    router.push(`/dashboard/sessionInfo?sessionId=${sessionId}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Today&apos;s Sessions</h1>

      {loading ? (
        <LoadingSpinner label="Loading sessions..." />
      ) : sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleClick(session.id)}
              className="cursor-pointer rounded-lg border bg-white p-4 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
            >
              <h2 className="mb-2 text-lg font-semibold sm:text-xl">{session.subject}</h2>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Class: {session.class_name || "N/A"}
              </p>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Room: {session.room}
              </p>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Teacher: {session.teacher_name || "N/A"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Time: {format(new Date(session.time), "PPPp")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Protected nonAdminOnly>
      <DashboardContent />
    </Protected>
  );
}
