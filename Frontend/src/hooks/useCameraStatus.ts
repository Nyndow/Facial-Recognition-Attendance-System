import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

interface CameraStatusResponse {
  session_id: number;
  camera_id: number | null;
  is_ongoing: boolean;
  is_activation_window: boolean;
  can_toggle: boolean;
  socket_connected: boolean;
  is_active: boolean;
}

export const useCameraStatus = (sessionId: number | null) => {
  const [isOngoing, setIsOngoing] = useState(false);
  const [isActivationWindow, setIsActivationWindow] = useState(false);
  const [canToggle, setCanToggle] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCameraStatus = useCallback(async () => {
    if (!sessionId) {
      setIsOngoing(false);
      setIsActivationWindow(false);
      setCanToggle(false);
      setSocketConnected(false);
      setIsActive(false);
      setHasCamera(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<CameraStatusResponse>(`/sessions/${sessionId}/camera-status`);
      setIsOngoing(res.data.is_ongoing);
      setIsActivationWindow(res.data.is_activation_window);
      setCanToggle(res.data.can_toggle);
      setSocketConnected(res.data.socket_connected);
      setIsActive(res.data.is_active);
      setHasCamera(!!res.data.camera_id);
    } catch (error) {
      console.error("Failed to fetch camera status", error);
      setIsOngoing(false);
      setIsActivationWindow(false);
      setCanToggle(false);
      setSocketConnected(false);
      setIsActive(false);
      setHasCamera(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const toggleCameraStatus = useCallback(async () => {
    if (!sessionId || !canToggle || !hasCamera || loading) return;

    setLoading(true);
    try {
      const res = await api.put<CameraStatusResponse>(`/sessions/${sessionId}/camera-status`, {
        isActive: !isActive,
      });
      setIsActive(res.data.is_active);
      setIsOngoing(res.data.is_ongoing);
      setIsActivationWindow(res.data.is_activation_window);
      setCanToggle(res.data.can_toggle);
      setSocketConnected(res.data.socket_connected);
      setHasCamera(!!res.data.camera_id);
    } catch (error) {
      console.error("Failed to update camera status", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, canToggle, hasCamera, loading, isActive]);

  useEffect(() => {
    fetchCameraStatus();
  }, [fetchCameraStatus]);

  return {
    isOngoing,
    isActivationWindow,
    canToggle,
    socketConnected,
    isActive,
    hasCamera,
    loading,
    fetchCameraStatus,
    toggleCameraStatus,
  };
};
