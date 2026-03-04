"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";
import api from "@/lib/api";

interface CameraOption {
  idCamera: number;
  nameCamera: string;
}

export default function AdminRoomsPage() {
  const [cameras, setCameras] = useState<CameraOption[]>([]);

  const loadCameras = useCallback(async () => {
    try {
      const res = await api.get("/cameras");
      const rows = Array.isArray(res.data) ? (res.data as CameraOption[]) : [];
      setCameras(rows);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        "Failed to load cameras";
      console.error(msg);
      setCameras([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCameras();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCameras]);

  const cameraOptions = useMemo(
    () =>
      cameras.map((camera) => ({
        label: `${camera.nameCamera} (ID: ${camera.idCamera})`,
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
          { key: "idRoom", label: "ID" },
          { key: "nameRoom", label: "Room Name" },
          { key: "idCamera", label: "Camera ID" },
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
