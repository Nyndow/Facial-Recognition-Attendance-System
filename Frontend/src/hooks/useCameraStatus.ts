import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import api from "@/lib/api";

type CameraStatus = 0 | 1;

interface CameraStatusOptions {
  refreshKey?: unknown;
}

const stopStream = (streamRef: MutableRefObject<MediaStream | null>) => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
};

export const useCameraStatus = (
  cameraId?: number | null,
  options?: CameraStatusOptions
) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCameraIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (cameraId) {
      lastCameraIdRef.current = cameraId;
    }
  }, [cameraId]);

  useEffect(() => {
    return () => {
      stopStream(streamRef);
    };
  }, []);

  useEffect(() => {
    if (!cameraId) return;
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        console.log(cameraId)
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

  useEffect(() => {
    const isCameraActive = cameraStatus === 1;
    if (!cameraId && isCameraActive) {
      stopStream(streamRef);
      const lastCameraId = lastCameraIdRef.current;
      if (lastCameraId) {
        api.post(`/camera-status/${lastCameraId}`, { status: 0 }).catch((err) => {
          console.error("Failed to update camera status.", err);
        });
      }
      setCameraStatus(0);
    }
  }, [cameraId, cameraStatus]);

  const toggleCamera = useCallback(async () => {
    if (!cameraId) {
      console.warn("No camera assigned to the active session.");
      return;
    }
    const isCameraActive = cameraStatus === 1;
    if (isCameraActive) {
      stopStream(streamRef);
      try {
        const res = await api.post(`/camera-status/${cameraId}`, { status: 0 });
        setCameraStatus(res.data?.status === 1 ? 1 : 0);
      } catch (err) {
        console.error("Failed to update camera status.", err);
        setCameraStatus(0);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      const res = await api.post(`/camera-status/${cameraId}`, { status: 1 });
      setCameraStatus(res.data?.status === 1 ? 1 : 0);
    } catch (err) {
      console.error("Unable to access webcam.", err);
      setCameraStatus(0);
    }
  }, [cameraId, cameraStatus]);

  return { cameraStatus, toggleCamera };
};
