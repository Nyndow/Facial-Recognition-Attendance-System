import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface RoomOption {
  idRoom: number;
  nameRoom: string;
}

export const useRooms = () => {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/rooms");
      setRooms(Array.isArray(res.data) ? (res.data as RoomOption[]) : []);
    } catch (err: unknown) {
      console.error("Failed to load rooms.", err);
      setRooms([]);
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, fetchRooms };
};
