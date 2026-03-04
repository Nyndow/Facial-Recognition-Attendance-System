"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminClassesPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Classes"
        endpoint="/classes"
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
        ]}
        fields={[{ key: "name", label: "Name", type: "text", required: true }]}
      />
    </Protected>
  );
}
