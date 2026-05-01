import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface SessionInfo {
  id: number;
  idRoom?: number;
  nameRoom?: string;
  room: string;
  subject: string;
  time: string | null;
  endSession: string;
  teacher_name?: string;
  class_id?: number;
  class_name?: string;
}

export const useSessionInfo = (sessionId: number | null) => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/sessions/by-session/${sessionId}`);
      setSession(res.data);
    } catch (err) {
      console.error(err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, fetchSession };
};
