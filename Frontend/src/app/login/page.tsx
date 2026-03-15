"use client";

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authenticatedUser = await login(username, password);
      if (authenticatedUser?.isAdmin) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      setError(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-64 w-64 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/20" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md space-y-5 rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-300/80">
            ENI Attendance Application
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Welcome
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in to access the application.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Username
            </span>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500/60"
        >
          Login
        </button>
      </form>
    </div>
  );
}
