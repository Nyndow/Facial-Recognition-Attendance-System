"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminUsersPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Users"
        endpoint="/users"
        columns={[
          { key: "id", label: "ID" },
          { key: "username", label: "Username" },
          { key: "idClass", label: "Class ID" },
          { key: "idTeacher", label: "Teacher ID" },
          { key: "isAdmin", label: "Admin" },
        ]}
        fields={[
          { key: "username", label: "Username", type: "text", required: true },
          { key: "password", label: "Password", type: "password", requiredOnCreate: true },
          { key: "idClass", label: "Class ID", type: "number" },
          { key: "idTeacher", label: "Teacher ID", type: "number" },
          { key: "isAdmin", label: "Is Admin", type: "checkbox" },
        ]}
      />
    </Protected>
  );
}
