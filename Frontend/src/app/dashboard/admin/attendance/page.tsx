"use client";

import { Fragment, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAttendanceOverview } from "@/hooks/useAttendanceOverview";

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

interface StudentAttendanceSummary {
  student_id: number;
  student_name: string;
  matricule: string;
  class_name: string | null;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  history: ReturnType<typeof useAttendanceOverview>["records"];
}

export default function AdminAttendancePage() {
  const { records, loading, error, fetchAttendanceOverview } = useAttendanceOverview();
  const [query, setQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  const studentSummaries = useMemo<StudentAttendanceSummary[]>(() => {
    const grouped = new Map<number, StudentAttendanceSummary>();

    records.forEach((record) => {
      const existing = grouped.get(record.student_id);

      if (!existing) {
        grouped.set(record.student_id, {
          student_id: record.student_id,
          student_name: record.student_name,
          matricule: record.matricule,
          class_name: record.class_name,
          totalSessions: 1,
          presentCount: record.present ? 1 : 0,
          absentCount: record.present ? 0 : 1,
          attendanceRate: 0,
          history: [record],
        });
        return;
      }

      existing.totalSessions += 1;
      existing.presentCount += record.present ? 1 : 0;
      existing.absentCount += record.present ? 0 : 1;
      existing.history.push(record);
    });

    return Array.from(grouped.values())
      .map((summary) => ({
        ...summary,
        attendanceRate:
          summary.totalSessions === 0
            ? 0
            : Math.round((summary.presentCount / summary.totalSessions) * 100),
        history: [...summary.history].sort((a, b) => {
          const aTime = a.session_time ? new Date(a.session_time).getTime() : 0;
          const bTime = b.session_time ? new Date(b.session_time).getTime() : 0;
          return bTime - aTime;
        }),
      }))
      .sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [records]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return studentSummaries.filter((student) => {
      if (!normalizedQuery) return true;

      return [student.student_name, student.matricule, student.class_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [query, studentSummaries]);

  const stats = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const trackedSessions = filteredStudents.reduce((sum, student) => sum + student.totalSessions, 0);
    const presentMarks = filteredStudents.reduce((sum, student) => sum + student.presentCount, 0);
    const absentMarks = filteredStudents.reduce((sum, student) => sum + student.absentCount, 0);

    return {
      totalStudents,
      trackedSessions,
      presentMarks,
      absentMarks,
    };
  }, [filteredStudents]);

  return (
    <Protected adminOnly>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Student Attendance</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Check attendance totals and session history for each student.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchAttendanceOverview()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-300">Students</p>
            <p className="mt-2 text-2xl font-semibold">{stats.totalStudents}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-300">Tracked Sessions</p>
            <p className="mt-2 text-2xl font-semibold">{stats.trackedSessions}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-300">Present Marks</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">{stats.presentMarks}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-300">Absent Marks</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">{stats.absentMarks}</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Search Student</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name, matricule, or class"
              className="rounded border p-2 dark:bg-slate-700 dark:text-white"
            />
          </label>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold">Students</h2>

          {loading ? (
            <LoadingSpinner label="Loading student attendance..." />
          ) : filteredStudents.length === 0 ? (
            <p>No students found for the current search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-lg border text-sm sm:text-base">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left sm:px-4">Student</th>
                    <th className="px-3 py-2 text-left sm:px-4">Matricule</th>
                    <th className="px-3 py-2 text-left sm:px-4">Class</th>
                    <th className="px-3 py-2 text-left sm:px-4">Sessions</th>
                    <th className="px-3 py-2 text-left sm:px-4">Present</th>
                    <th className="px-3 py-2 text-left sm:px-4">Absent</th>
                    <th className="px-3 py-2 text-left sm:px-4">Rate</th>
                    <th className="px-3 py-2 text-left sm:px-4">History</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudentId === student.student_id;

                    return (
                      <Fragment key={student.student_id}>
                        <tr className="border-b">
                          <td className="px-3 py-2 sm:px-4">{student.student_name}</td>
                          <td className="px-3 py-2 sm:px-4">{student.matricule}</td>
                          <td className="px-3 py-2 sm:px-4">{student.class_name ?? "-"}</td>
                          <td className="px-3 py-2 sm:px-4">{student.totalSessions}</td>
                          <td className="px-3 py-2 sm:px-4 text-green-600">{student.presentCount}</td>
                          <td className="px-3 py-2 sm:px-4 text-red-600">{student.absentCount}</td>
                          <td className="px-3 py-2 sm:px-4">
                            <span className="font-semibold">{student.attendanceRate}%</span>
                          </td>
                          <td className="px-3 py-2 sm:px-4">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedStudentId(isExpanded ? null : student.student_id)
                              }
                              className="rounded border px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b bg-gray-50 dark:bg-slate-900/40">
                            <td colSpan={8} className="px-3 py-4 sm:px-4">
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b text-left">
                                      <th className="px-2 py-2">Subject</th>
                                      <th className="px-2 py-2">Teacher</th>
                                      <th className="px-2 py-2">Room</th>
                                      <th className="px-2 py-2">Session Start</th>
                                      <th className="px-2 py-2">Checked At</th>
                                      <th className="px-2 py-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {student.history.map((record) => (
                                      <tr
                                        key={`${record.class_session_id}-${record.student_id}`}
                                        className="border-b last:border-b-0"
                                      >
                                        <td className="px-2 py-2">{record.subject}</td>
                                        <td className="px-2 py-2">{record.teacher_name ?? "-"}</td>
                                        <td className="px-2 py-2">{record.room_name ?? "-"}</td>
                                        <td className="px-2 py-2">{formatDateTime(record.session_time)}</td>
                                        <td className="px-2 py-2">{formatDateTime(record.timestamp)}</td>
                                        <td className="px-2 py-2">
                                          <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                              record.present
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                            }`}
                                          >
                                            {record.present ? "Present" : "Absent"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
