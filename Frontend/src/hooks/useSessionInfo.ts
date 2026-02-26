import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface SessionInfo {
  id: number;
  room: string;
  subject: string;
  time: string | null;
  teacher_name?: string;
  class_id?: number;
  class_name?: string;
}

export const useSessionInfo = (sessionId: number | null) => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    if (!sessionId) return;
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
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  return { session, loading, fetchSession };
};