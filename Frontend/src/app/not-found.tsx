"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-800">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <Link
            href="/"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
