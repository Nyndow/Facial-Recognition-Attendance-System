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

  // Fetch current status
  useEffect(() => {
    if (!cameraId) return;
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/camera-status/${cameraId}`);
        if (!isMounted) return;
        setCameraStatus(res.data?.status === 1 ? 1 : 0);
      } catch (err) {
        console.error("Failed to fetch camera status.", err);
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [cameraId, options?.refreshKey]);

  // Toggle camera status
  const toggleCamera = useCallback(async () => {
    if (!cameraId) {
      console.warn("No camera assigned.");
      return;
    }

    const newStatus: CameraStatus = cameraStatus === 1 ? 0 : 1;

    try {
      const res = await api.post(`/camera-status/${cameraId}`, { status: newStatus });
      setCameraStatus(res.data?.status === 1 ? 1 : 0);
    } catch (err) {
      console.error("Failed to update camera status.", err);
      // fallback: assume status did not change
      setCameraStatus(cameraStatus);
    }
  }, [cameraId, cameraStatus]);

  return { cameraStatus, toggleCamera };
};