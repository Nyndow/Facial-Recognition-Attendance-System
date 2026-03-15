import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface TeacherOption {
  id: number;
  name: string;
}

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/teachers");
      setTeachers(Array.isArray(res.data) ? (res.data as TeacherOption[]) : []);
    } catch (err: unknown) {
      console.error("Failed to load teachers.", err);
      setTeachers([]);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return { teachers, loading, error, fetchTeachers };
};
