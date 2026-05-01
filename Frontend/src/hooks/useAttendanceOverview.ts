"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface AttendanceOverviewRow {
  attendance_id: number | null;
  student_id: number;
  student_name: string;
  matricule: string;
  class_id: number | null;
  class_name: string | null;
  class_session_id: number;
  subject: string;
  session_time: string | null;
  session_end: string | null;
  teacher_id: number | null;
  teacher_name: string | null;
  room_id: number | null;
  room_name: string | null;
  timestamp: string | null;
  present: boolean;
}

export const useAttendanceOverview = () => {
  const [records, setRecords] = useState<AttendanceOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/attendance/overview");
      const rows = Array.isArray(res.data) ? (res.data as AttendanceOverviewRow[]) : [];
      setRecords(rows);
    } catch (err) {
      console.error("Failed to load attendance overview.", err);
      setRecords([]);
      setError("Failed to load attendance overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceOverview();
  }, [fetchAttendanceOverview]);

  return {
    records,
    loading,
    error,
    fetchAttendanceOverview,
  };
};
