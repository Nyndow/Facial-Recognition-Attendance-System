"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";
import api from "@/lib/api";

interface RoomOption {
  idRoom: number;
  nameRoom: string;
}

interface TeacherOption {
  id: number;
  name: string;
}

interface ClassOption {
  id: number;
  name: string;
}

export default function AdminSessionsPage() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const [roomsRes, teachersRes, classesRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/teachers"),
        api.get("/classes"),
      ]);

      setRooms(Array.isArray(roomsRes.data) ? (roomsRes.data as RoomOption[]) : []);
      setTeachers(Array.isArray(teachersRes.data) ? (teachersRes.data as TeacherOption[]) : []);
      setClasses(Array.isArray(classesRes.data) ? (classesRes.data as ClassOption[]) : []);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        "Failed to load session options";
      console.error(msg);
      setRooms([]);
      setTeachers([]);
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOptions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOptions]);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `${room.nameRoom} (ID: ${room.idRoom})`,
        value: room.idRoom,
      })),
    [rooms]
  );

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        label: `${teacher.name} (ID: ${teacher.id})`,
        value: teacher.id,
      })),
    [teachers]
  );

  const classOptions = useMemo(
    () =>
      classes.map((classItem) => ({
        label: `${classItem.name} (ID: ${classItem.id})`,
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
          { key: "id", label: "ID" },
          { key: "subject", label: "Subject" },
          { key: "time", label: "Start Time" },
          { key: "endSession", label: "End Time" },
          { key: "idRoom", label: "Room ID" },
          { key: "teacher_id", label: "Teacher ID" },
          { key: "class_id", label: "Class ID" },
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
