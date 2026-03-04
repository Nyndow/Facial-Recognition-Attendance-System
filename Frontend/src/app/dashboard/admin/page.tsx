"use client";

import Link from "next/link";
import Protected from "@/components/Protected";

const adminSections = [
  { href: "/dashboard/admin/users", title: "Users", description: "Create and manage platform users." },
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
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin CRUD</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Admin accounts access CRUD management pages only.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-1">{section.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </Protected>
  );
}
