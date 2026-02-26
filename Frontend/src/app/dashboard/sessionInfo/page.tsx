"use client";

import { useSearchParams } from "next/navigation";
import Protected from "@/components/Protected";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import { useSessionStudents } from "@/hooks/useSessionStudents";
import { useExportAttendance } from "@/hooks/useFile";

export default function SessionInfoPage() {
    const searchParams = useSearchParams();
    const sessionIdParam = searchParams.get("sessionId");
    const sessionId = sessionIdParam ? parseInt(sessionIdParam) : null;

    const { session, loading: sessionLoading } = useSessionInfo(sessionId);
    const { students, loading: studentsLoading } = useSessionStudents(sessionId);
    const { exportPDF, loading: exportLoading } = useExportAttendance();

    if (!sessionId) return <p>No session selected.</p>;

    return (
        <Protected>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Session Info */}
                {sessionLoading ? (
                    <p>Loading session info...</p>
                ) : !session ? (
                    <p>Session not found.</p>
                ) : (
                    <div className="border rounded-lg p-6 shadow bg-white dark:bg-gray-800 space-y-4">
                        <h2 className="text-2xl font-semibold">{session.subject}</h2>
                        <p>
                            <span className="font-medium">Class:</span> {session.class_name || "N/A"}
                        </p>
                        <p>
                            <span className="font-medium">Room:</span> {session.room}
                        </p>
                        <p>
                            <span className="font-medium">Teacher:</span> {session.teacher_name || "N/A"}
                        </p>
                        <p>
                            <span className="font-medium">Time:</span> {session.time || "N/A"}
                        </p>
                        <button
                            onClick={() => exportPDF(session, students)}
                            disabled={exportLoading || students.length === 0}
                            className={`mt-4 px-4 py-2 rounded text-white transition ${exportLoading || students.length === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                                }`}
                        >
                            {exportLoading ? "Exporting..." : "Export PDF"}
                        </button>
                    </div>
                )}

                {/* Students Table */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Students</h2>
                    {studentsLoading ? (
                        <p>Loading students...</p>
                    ) : students.length === 0 ? (
                        <p>No students found for this session.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border rounded-lg overflow-hidden">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Matricule</th>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">Present</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-600"
                                        >
                                            <td className="px-4 py-2">{s.matricule}</td>
                                            <td className="px-4 py-2">{s.name}</td>
                                            <td className="px-4 py-2">
                                                {s.present ? (
                                                    <span className="text-green-600 font-semibold">Yes</span>
                                                ) : (
                                                    <span className="text-red-600 font-semibold">No</span>
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
        </Protected>
    );
}