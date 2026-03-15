import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface ClassOption {
  id: number;
  name: string;
}

export const useClasses = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/classes");
      setClasses(Array.isArray(res.data) ? (res.data as ClassOption[]) : []);
    } catch (err: unknown) {
      console.error("Failed to load classes.", err);
      setClasses([]);
      setError("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { classes, loading, error, fetchClasses };
};
