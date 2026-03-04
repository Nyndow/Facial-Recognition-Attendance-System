"use client";

import { useSearchParams } from "next/navigation";
import Protected from "@/components/Protected";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import { useSessionStudents } from "@/hooks/useSessionStudents";
import { useExportAttendance } from "@/hooks/useFile";
import LoadingSpinner from "@/components/LoadingSpinner";

function SessionInfoContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam) : null;

  const { session, loading: sessionLoading } = useSessionInfo(sessionId);
  const { students, loading: studentsLoading } = useSessionStudents(sessionId);
  const { exportPDF, loading: exportLoading } = useExportAttendance();

  if (!sessionId) return <p>No session selected.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {sessionLoading ? (
        <LoadingSpinner label="Loading session info..." />
      ) : !session ? (
        <p>Session not found.</p>
      ) : (
        <div className="space-y-4 rounded-lg border bg-white p-4 shadow dark:bg-gray-800 sm:p-6">
          <h2 className="text-xl font-semibold sm:text-2xl">{session.subject}</h2>
          <p>
            <span className="font-medium">Class:</span> {session.class_name || "N/A"}
          </p>
          <p>
            <span className="font-medium">Room:</span> {session.room}
          </p>
          <p>
            <span className="font-medium">Teacher:</span> {session.teacher_name || "N/A"}
          </p>
          <p className="break-words">
            <span className="font-medium">Time:</span> {session.time || "N/A"}
          </p>
          <button
            onClick={() => exportPDF(session, students)}
            disabled={exportLoading || students.length === 0}
            className={`mt-2 rounded px-4 py-2 text-white transition ${
              exportLoading || students.length === 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {exportLoading ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">Students</h2>
        {studentsLoading ? (
          <LoadingSpinner label="Loading students..." />
        ) : students.length === 0 ? (
          <p>No students found for this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-lg border text-sm sm:text-base">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left sm:px-4">Matricule</th>
                  <th className="px-3 py-2 text-left sm:px-4">Name</th>
                  <th className="px-3 py-2 text-left sm:px-4">Present</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-3 py-2 sm:px-4">{s.matricule}</td>
                    <td className="px-3 py-2 sm:px-4">{s.name}</td>
                    <td className="px-3 py-2 sm:px-4">
                      {s.present ? (
                        <span className="font-semibold text-green-600">Yes</span>
                      ) : (
                        <span className="font-semibold text-red-600">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionInfoPage() {
  return (
    <Protected nonAdminOnly>
      <SessionInfoContent />
    </Protected>
  );
}
