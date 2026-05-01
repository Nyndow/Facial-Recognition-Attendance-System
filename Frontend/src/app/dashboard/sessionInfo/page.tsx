"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import Protected from "@/components/Protected";
import ToastStack, { ToastItem, ToastType } from "@/components/ToastStack";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import { StudentInfo, useSessionStudents } from "@/hooks/useSessionStudents";
import { useExportAttendance } from "@/hooks/useFile";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PendingAttendanceChange {
  student: StudentInfo;
  present: boolean;
}

function SessionInfoContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam) : null;

  const { session, loading: sessionLoading } = useSessionInfo(sessionId);
  const { students, loading: studentsLoading, updateStudentPresentStatus } = useSessionStudents(
    sessionId
  );
  const { exportPDF, loading: exportLoading } = useExportAttendance();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingAttendanceChange | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const parseError = (err: unknown): string => {
    const axiosError = err as AxiosError<{ error?: string; message?: string }>;
    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message ||
      "Failed to update attendance."
    );
  };

  const openConfirmModal = (student: StudentInfo) => {
    setPendingChange({
      student,
      present: !student.present,
    });
  };

  const handlePresentChange = async () => {
    if (!pendingChange) return;

    const { student, present } = pendingChange;
    const nextLabel = present ? "present" : "absent";

    setUpdatingStudentId(student.id);
    setPendingChange(null);
    try {
      await updateStudentPresentStatus(student, present);
      showToast("success", `${student.name} marked as ${nextLabel}.`);
    } catch (err: unknown) {
      console.error(err);
      showToast("error", parseError(err));
    } finally {
      setUpdatingStudentId(null);
    }
  };

  if (!sessionId) return <p>No session selected.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {sessionLoading ? (
        <LoadingSpinner label="Loading session info..." />
      ) : !session ? (
        <p>Session not found.</p>
      ) : (
        <div className="space-y-4 rounded-lg border bg-white p-4 shadow dark:bg-slate-800 sm:p-6">
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
            <span className="font-medium">Start Time:</span> {session.time || "N/A"}
          </p>
          <p className="break-words">
            <span className="font-medium">End Time:</span> {session.endSession}
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
              <thead className="bg-gray-100 dark:bg-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left sm:px-4">Matricule</th>
                  <th className="px-3 py-2 text-left sm:px-4">Name</th>
                  <th className="px-3 py-2 text-left sm:px-4">Present</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const isUpdating = updatingStudentId === s.id;

                  return (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      <td className="px-3 py-2 sm:px-4">{s.matricule}</td>
                      <td className="px-3 py-2 sm:px-4">{s.name}</td>
                      <td className="px-3 py-2 sm:px-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openConfirmModal(s)}
                            disabled={isUpdating}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                              isUpdating
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer"
                            } ${
                              s.present
                                ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                            }`}
                          >
                            {s.present ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {isUpdating ? "Updating..." : s.present ? "Present" : "Absent"}
                          </button>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 rounded-full p-2 ${
                  pendingChange.present
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                <CircleAlert size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Confirm attendance update
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Change <span className="font-semibold">{pendingChange.student.name}</span> to{" "}
                  <span className="font-semibold">
                    {pendingChange.present ? "present" : "absent"}
                  </span>
                  ?
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Matricule: {pendingChange.student.matricule}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePresentChange}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                  pendingChange.present
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
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
