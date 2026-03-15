import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface StudentRow {
  id: number;
  name: string;
  matricule: string;
  class_id: number | null;
}

export interface StudentPayload {
  name: string;
  matricule: string;
  class_id: number | null;
  image?: string;
}

export const useStudents = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/students");
      const rows = Array.isArray(res.data) ? (res.data as StudentRow[]) : [];
      setStudents(rows);
    } catch (err: unknown) {
      console.error("Failed to load students.", err);
      setStudents([]);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const createStudent = useCallback(async (payload: StudentPayload) => {
    await api.post("/students", payload);
  }, []);

  const updateStudent = useCallback(async (id: number, payload: StudentPayload) => {
    await api.put(`/students/${id}`, payload);
  }, []);

  const deleteStudent = useCallback(async (id: number) => {
    await api.delete(`/students/${id}`);
  }, []);

  return {
    students,
    loading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
};
