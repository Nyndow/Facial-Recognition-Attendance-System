import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface CurrentUser {
  id: number;
  username: string;
  isAdmin: boolean;
  idClass?: number;
  idTeacher?: number;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await api.get("/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch current user", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: { username?: string; password?: string }) => {
    if (!user) return;
    setUpdating(true);
    try {
      await api.put("/me", data);
      await fetchUser();
      alert("Profile updated successfully");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Failed to update profile");
      }
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, updating, fetchUser, updateUser };
};