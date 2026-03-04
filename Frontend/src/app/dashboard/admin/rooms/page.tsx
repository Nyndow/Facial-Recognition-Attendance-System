"use client";

import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";

export default function AdminRoomsPage() {
  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Rooms"
        endpoint="/rooms"
        idKey="idRoom"
        columns={[
          { key: "idRoom", label: "ID" },
          { key: "nameRoom", label: "Room Name" },
          { key: "idCamera", label: "Camera ID" },
          { key: "nameCamera", label: "Camera Name" },
        ]}
        fields={[
          { key: "nameRoom", label: "Room Name", type: "text", required: true },
          { key: "idCamera", label: "Camera ID", type: "number" },
        ]}
      />
    </Protected>
  );
}
