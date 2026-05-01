import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

type CameraStatus = 0 | 1;

interface CameraStatusOptions {
  refreshKey?: unknown;
}

export const useCameraStatus = (
  cameraId?: number | null,
  options?: CameraStatusOptions
) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!cameraId) return;

    try {
      const res = await api.get(`/camera-status/${cameraId}`);
      setCameraStatus(res.data?.status === 1 ? 1 : 0);
    } catch (err) {
      console.error("Failed to fetch camera status.", err);
    }
  }, [cameraId]);

  // Fetch current status
  useEffect(() => {
    if (!cameraId) return;
    fetchStatus();
  }, [cameraId, fetchStatus, options?.refreshKey]);

  // Toggle camera status
  const toggleCamera = useCallback(async () => {
    if (!cameraId) {
      console.warn("No camera assigned.");
      return;
    }

    if (isUpdating) {
      return;
    }

    const nextStatus: CameraStatus = cameraStatus === 1 ? 0 : 1;

    setIsUpdating(true);
    try {
      const res = await api.post(`/camera-status/${cameraId}`, { status: nextStatus });
      setCameraStatus(res.data?.status === 1 ? 1 : 0);
    } catch (err) {
      console.error("Failed to update camera status.", err);
      await fetchStatus();
    } finally {
      setIsUpdating(false);
    }
  }, [cameraId, cameraStatus, fetchStatus, isUpdating]);

  return { cameraStatus, toggleCamera, isUpdating };
};
