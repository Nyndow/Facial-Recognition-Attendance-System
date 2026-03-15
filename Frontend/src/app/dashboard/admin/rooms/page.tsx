"use client";

import { useMemo } from "react";
import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";
import { useCameras } from "@/hooks/useCameras";

export default function AdminRoomsPage() {
  const { cameras } = useCameras();

  const cameraOptions = useMemo(
    () =>
      cameras.map((camera) => ({
        label: camera.nameCamera,
        value: camera.idCamera,
      })),
    [cameras]
  );

  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Rooms"
        endpoint="/rooms"
        idKey="idRoom"
        columns={[
          { key: "nameRoom", label: "Room Name" },
          { key: "nameCamera", label: "Camera Name" },
        ]}
        fields={[
          { key: "nameRoom", label: "Room Name", type: "text", required: true },
          {
            key: "idCamera",
            label: "Camera",
            type: "select",
            options: cameraOptions,
            optionPlaceholder: "No camera",
            valueType: "number",
          },
        ]}
      />
    </Protected>
  );
}
