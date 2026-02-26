"use client";

import { useState, FormEvent } from "react";
import Protected from "@/components/Protected";
import { useCurrentUser } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { user, loading, updating, updateUser } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Set initial form values when user loads
  if (user && username === "") setUsername(user.username);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updateUser({
      username: username !== user?.username ? username : undefined,
      password: password || undefined,
    });
    setPassword("");
  };

  if (loading) return <p>Loading user info...</p>;

  if (!user) return <p>User not found.</p>;

  return (
    <Protected>
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className={`w-full py-2 px-4 rounded text-white ${
              updating ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {updating ? "Updating..." : "Update Profile"}
          </button>
        </form>

        <div className="pt-4 text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-semibold">Role:</span> {user.isAdmin ? "Admin" : "User"}
          </p>
          {user.idClass && (
            <p>
              <span className="font-semibold">Class ID:</span> {user.idClass}
            </p>
          )}
          {user.idTeacher && (
            <p>
              <span className="font-semibold">Teacher ID:</span> {user.idTeacher}
            </p>
          )}
        </div>
      </div>
    </Protected>
  );
}