"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminCamerasPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Cameras"
        endpoint="/cameras"
        idKey="idCamera"
        columns={[
          { key: "idCamera", label: "ID" },
          { key: "nameCamera", label: "Camera Name" },
          { key: "urlCamera", label: "URL" },
        ]}
        fields={[
          { key: "nameCamera", label: "Camera Name", type: "text", required: true },
          { key: "urlCamera", label: "Camera URL", type: "text" },
        ]}
      />
    </Protected>
  );
}
