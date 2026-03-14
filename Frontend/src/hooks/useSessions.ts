import { useState, useEffect } from "react";
import api from "../lib/api";

export interface Session {
  id: number;
  idRoom?: number;
  nameRoom?: string;
  room: string;
  subject: string;
  time: string; // ISO string
  endSession: string;
  teacher_name?: string;
  class_id?: number;
  class_name?: string;
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      const data: Session[] = res.data;

      // Sort so today's sessions come first
      const now = new Date();
      data.sort((a, b) => {
        const aDate = new Date(a.time);
        const bDate = new Date(b.time);

        const isToday = (d: Date) =>
          d.toDateString() === now.toDateString();

        if (isToday(aDate) && !isToday(bDate)) return -1;
        if (!isToday(aDate) && isToday(bDate)) return 1;
        return aDate.getTime() - bDate.getTime(); // ascending
      });

      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, loading, fetchSessions };
};
