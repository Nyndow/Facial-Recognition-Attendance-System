"use client";

import { useSessions } from "@/hooks/useSessions";
import Protected from "@/components/Protected";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";

function DashboardContent() {
  const { sessions, loading } = useSessions();
  const router = useRouter();
  const today = new Date();

  const todaySessions = sessions.filter((session) =>
    isSameDay(new Date(session.time), today),
  );
  const otherSessions = sessions.filter(
    (session) => !isSameDay(new Date(session.time), today),
  );

  const handleClick = (sessionId: number) => {
    router.push(`/dashboard/sessionInfo?sessionId=${sessionId}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Dashboard</h1>

      {loading ? (
        <LoadingSpinner label="Loading sessions..." />
      ) : sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Today&apos;s Sessions</h2>
            {todaySessions.length === 0 ? (
              <p>No sessions scheduled for today.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {todaySessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleClick(session.id)}
                    className="cursor-pointer rounded-lg border bg-white p-4 shadow transition-shadow hover:border-blue-200 hover:shadow-lg dark:bg-gray-800 dark:hover:border-blue-400/40"
                  >
                    <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                      {session.subject}
                    </h3>
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
                      Start Time: {format(new Date(session.time), "PPPp")} -{" "}
                      {format(new Date(session.endSession), "PPPp")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <hr className="mb-4 border-gray-300 dark:border-gray-700" />
            <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Other Sessions</h2>
            {otherSessions.length === 0 ? (
              <p>No other sessions scheduled.</p>
            ) : (
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleClick(session.id)}
                    className="cursor-pointer rounded-lg border bg-white p-4 shadow transition-shadow hover:border-blue-200 hover:shadow-lg dark:bg-gray-800 dark:hover:border-blue-400/40"
                  >
                    <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                      {session.subject}
                    </h3>
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
                      Start Time: {format(new Date(session.time), "PPPp")} -{" "}
                      {format(new Date(session.endSession), "PPPp")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
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
