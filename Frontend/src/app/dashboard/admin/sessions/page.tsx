"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminSessionsPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Class Sessions"
        endpoint="/class_sessions"
        columns={[
          { key: "id", label: "ID" },
          { key: "subject", label: "Subject" },
          { key: "time", label: "Time" },
          { key: "idRoom", label: "Room ID" },
          { key: "teacher_id", label: "Teacher ID" },
          { key: "class_id", label: "Class ID" },
        ]}
        fields={[
          { key: "subject", label: "Subject", type: "text", required: true },
          { key: "time", label: "Time", type: "datetime-local" },
          { key: "idRoom", label: "Room ID", type: "number", required: true },
          { key: "teacher_id", label: "Teacher ID", type: "number", required: true },
          { key: "class_id", label: "Class ID", type: "number", required: true },
        ]}
      />
    </Protected>
  );
}
