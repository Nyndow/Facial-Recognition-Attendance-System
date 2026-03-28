"use client";

import Link from "next/link";
import Protected from "@/components/Protected";

const adminSections = [
  { href: "/dashboard/admin/users", title: "Users", description: "Create and manage platform users." },
  { href: "/dashboard/admin/students", title: "Students", description: "Create and manage student records with webcam face capture." },
  { href: "/dashboard/admin/classes", title: "Classes", description: "Manage class records." },
  { href: "/dashboard/admin/teachers", title: "Teachers", description: "Manage teacher records." },
  { href: "/dashboard/admin/subjects", title: "Subjects", description: "Manage subject records." },
  { href: "/dashboard/admin/rooms", title: "Rooms", description: "Manage rooms and camera assignments." },
  { href: "/dashboard/admin/cameras", title: "Cameras", description: "Manage available cameras." },
  { href: "/dashboard/admin/sessions", title: "Sessions", description: "Create and maintain class sessions." },
];

export default function AdminDashboardPage() {
  return (
    <Protected adminOnly>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Admin CRUD</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-slate-300 sm:text-base">
          Admin accounts access CRUD management pages only.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800"
            >
              <h2 className="mb-1 text-lg font-semibold sm:text-xl">{section.title}</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </Protected>
  );
}
