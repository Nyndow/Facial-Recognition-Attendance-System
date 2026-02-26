import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface StudentInfo {
  id: number;
  name: string;
  matricule: string;
  present: boolean;
  attendance_id?: number | null;
}

export const useSessionStudents = (sessionId: number | null) => {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/session_students?session_id=${sessionId}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [sessionId]);

  return { students, loading, fetchStudents };
};