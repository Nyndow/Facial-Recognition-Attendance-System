"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminTeachersPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Teachers"
        endpoint="/teachers"
        columns={[
          { key: "name", label: "Name" },
        ]}
        fields={[{ key: "name", label: "Name", type: "text", required: true }]}
      />
    </Protected>
  );
}
