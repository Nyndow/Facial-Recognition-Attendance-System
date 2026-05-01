import { useCallback, useEffect, useState } from "react";
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

  const fetchStudents = useCallback(async () => {
    if (!sessionId) {
      setStudents([]);
      setLoading(false);
      return;
    }
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
  }, [sessionId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const updateStudentPresentStatus = useCallback(
    async (student: StudentInfo, present: boolean) => {
      if (!sessionId) return;

      if (student.attendance_id) {
        await api.put(`/attendance/${student.attendance_id}`, {
          student_id: student.id,
          class_session_id: sessionId,
          present,
        });
      } else {
        await api.post("/attendance", {
          student_id: student.id,
          class_session_id: sessionId,
          present,
        });
      }

      await fetchStudents();
    },
    [fetchStudents, sessionId]
  );

  return { students, loading, fetchStudents, updateStudentPresentStatus };
};
