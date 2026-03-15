"use client";

import { useMemo } from "react";
import Protected from "@/components/Protected";
import AdminCrudPage from "@/components/AdminCrudPage";
import { useTeachers } from "@/hooks/useTeachers";
import { useClasses } from "@/hooks/useClasses";

export default function AdminUsersPage() {
  const { teachers } = useTeachers();
  const { classes } = useClasses();

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
        title="Users"
        endpoint="/users"
        columns={[
          { key: "username", label: "Username" },
          { key: "class_name", label: "Class" },
          { key: "teacher_name", label: "Teacher" },
          { key: "isAdmin", label: "Admin" },
        ]}
        fields={[
          { key: "username", label: "Username", type: "text", required: true },
          { key: "password", label: "Password", type: "password", requiredOnCreate: true },
          {
            key: "idClass",
            label: "Class",
            type: "select",
            options: classOptions,
            optionPlaceholder: "Select class (optional)",
            valueType: "number",
          },
          {
            key: "idTeacher",
            label: "Teacher",
            type: "select",
            options: teacherOptions,
            optionPlaceholder: "Select teacher (optional)",
            valueType: "number",
          },
          { key: "isAdmin", label: "Is Admin", type: "checkbox" },
        ]}
      />
    </Protected>
  );
}
