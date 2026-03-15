"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Protected from "@/components/Protected";
import { useCurrentUser } from "@/hooks/useProfile";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updating, updateUser } = useCurrentUser();
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextUsername = (username ?? user?.username ?? "").trim();
    await updateUser({
      username: nextUsername !== user?.username ? nextUsername : undefined,
      password: password || undefined,
    });
    setPassword("");
  };

  if (loading) return <LoadingSpinner label="Loading user info..." fullScreen />;

  if (!user) return <p>User not found.</p>;

  return (
    <Protected>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow dark:bg-gray-800 sm:p-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-gray-700 dark:text-gray-200">Username</label>
              <input
                type="text"
                value={username ?? user.username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border p-2 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-gray-700 dark:text-gray-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full rounded border p-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className={`w-full rounded py-2 px-4 text-white ${
                updating ? "cursor-not-allowed bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {updating ? "Updating..." : "Update Profile"}
            </button>
          </form>

          <div className="pt-2 text-gray-600 dark:text-gray-300">
            <p>
              <span className="font-semibold">Role:</span> {user.isAdmin ? "Admin" : "User"}
            </p>
          </div>
        </div>
      </div>
    </Protected>
  );
}
