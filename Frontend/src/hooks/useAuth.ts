import { useState, useEffect } from "react";
import api from "../lib/api";

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  idClass?: number;
  idTeacher?: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (): Promise<User | null> => {
    try {
      const res = await api.get("/me");
      setUser(res.data);
      return res.data as User;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<User | null> => {
    const res = await api.post("/login", { username, password });
    const token = res.data.token;
    localStorage.setItem("token", token);
    return await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading, login, logout, fetchMe };
};
