"use client";

import { useMemo } from "react";
import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";
import { useRooms } from "@/hooks/useRooms";
import { useTeachers } from "@/hooks/useTeachers";
import { useClasses } from "@/hooks/useClasses";

export default function AdminSessionsPage() {
  const { rooms } = useRooms();
  const { teachers } = useTeachers();
  const { classes } = useClasses();

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.nameRoom,
        value: room.idRoom,
      })),
    [rooms]
  );

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        label: teacher.name,
        value: teacher.id,
      })),
    [teachers]
  );

  const classOptions = useMemo(
    () =>
      classes.map((classItem) => ({
        label: classItem.name,
        value: classItem.id,
      })),
    [classes]
  );

  return (
    <Protected adminOnly>
      <AdminCrudPage
        title="Class Sessions"
        endpoint="/class_sessions"
        columns={[
          { key: "subject", label: "Subject" },
          { key: "time", label: "Start Time" },
          { key: "endSession", label: "End Time" },
          { key: "nameRoom", label: "Room" },
          { key: "nameCamera", label: "Camera" },
          { key: "teacher_name", label: "Teacher" },
          { key: "class_name", label: "Class" },
        ]}
        fields={[
          { key: "subject", label: "Subject", type: "text", required: true },
          { key: "time", label: "Start Time", type: "datetime-local" },
          { key: "endSession", label: "End Time", type: "datetime-local", required: true },
          {
            key: "idRoom",
            label: "Room",
            type: "select",
            options: roomOptions,
            optionPlaceholder: "Select room",
            valueType: "number",
            required: true,
          },
          {
            key: "teacher_id",
            label: "Teacher",
            type: "select",
            options: teacherOptions,
            optionPlaceholder: "Select teacher",
            valueType: "number",
            required: true,
          },
          {
            key: "class_id",
            label: "Class",
            type: "select",
            options: classOptions,
            optionPlaceholder: "Select class",
            valueType: "number",
            required: true,
          },
        ]}
      />
    </Protected>
  );
}
