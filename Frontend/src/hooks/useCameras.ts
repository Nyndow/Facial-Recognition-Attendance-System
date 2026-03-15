import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface CameraOption {
  idCamera: number;
  nameCamera: string;
}

export const useCameras = () => {
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/cameras");
      const rows = Array.isArray(res.data) ? (res.data as CameraOption[]) : [];
      setCameras(rows);
    } catch (err: unknown) {
      console.error("Failed to load cameras.", err);
      setCameras([]);
      setError("Failed to load cameras.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  return { cameras, loading, error, fetchCameras };
};
