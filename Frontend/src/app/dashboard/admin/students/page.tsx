"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import Image from "next/image";
import { X } from "lucide-react";
import Protected from "@/components/Protected";
import ToastStack, { ToastItem, ToastType } from "@/components/ToastStack";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useStudents, StudentPayload, StudentRow } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";

interface StudentForm {
  name: string;
  matricule: string;
  class_id: string;
}

const initialForm: StudentForm = {
  name: "",
  matricule: "",
  class_id: "",
};

export default function AdminStudentsPage() {
  const {
    students,
    loading,
    error: studentsError,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();
  const { classes, error: classesError } = useClasses();
  const [form, setForm] = useState<StudentForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<StudentRow | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const parseError = (err: unknown): string => {
    const axiosError = err as AxiosError<{
      error?: string;
      message?: string;
      matched_student?: { name?: string; matricule?: string };
      score?: number;
    }>;
    const apiError =
      axiosError.response?.data?.error || axiosError.response?.data?.message || "Request failed";

    if (
      apiError === "Face already registered" &&
      axiosError.response?.data?.matched_student?.name &&
      axiosError.response?.data?.matched_student?.matricule
    ) {
      const matched = axiosError.response.data.matched_student;
      const score = axiosError.response.data.score;
      return `Face already registered to ${matched.name} (${matched.matricule})${
        score !== undefined ? `, score ${score}` : ""
      }.`;
    }

    return apiError;
  };

  useEffect(() => {
    fetchStudents().catch((err: unknown) => {
      showToast("error", parseError(err));
    });
  }, [fetchStudents, showToast]);

  useEffect(() => {
    if (studentsError) {
      showToast("error", studentsError);
    }
  }, [studentsError, showToast]);

  useEffect(() => {
    if (classesError) {
      showToast("error", classesError);
    }
  }, [classesError, showToast]);

  const classNameById = useMemo(() => {
    const map = new Map<number, string>();
    classes.forEach((classItem) => {
      map.set(classItem.id, classItem.name);
    });
    return map;
  }, [classes]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      console.error(err);
      showToast("error", "Unable to access webcam. Check browser permissions.");
    }
  };

  const captureFace = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      showToast("error", "Camera is not ready yet. Please try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showToast("error", "Failed to capture image.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    showToast("success", "Face captured successfully.");
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setCapturedImage("");
    stopCamera();
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditForm = (student: StudentRow) => {
    setCreateModalOpen(false);
    setEditingId(student.id);
    setCapturedImage("");
    stopCamera();
    setForm({
      name: student.name ?? "",
      matricule: student.matricule ?? "",
      class_id: student.class_id !== null ? String(student.class_id) : "",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const classId = form.class_id.trim() ? Number(form.class_id.trim()) : null;
    const payload: StudentPayload = {
      name: form.name.trim(),
      matricule: form.matricule.trim(),
      class_id: classId,
    };

    if (capturedImage) {
      payload.image = capturedImage;
    }

    if (editingId === null && !payload.image) {
      setSubmitting(false);
      showToast("error", "Capture a face image with the webcam before creating a student.");
      return;
    }

    try {
      if (editingId === null) {
        await createStudent(payload);
        showToast("success", "Student created successfully.");
        setCreateModalOpen(false);
      } else {
        await updateStudent(editingId, payload);
        showToast("success", "Student updated successfully.");
      }
      resetForm();
      await fetchStudents();
    } catch (err: unknown) {
      showToast("error", parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (student: StudentRow) => {
    setPendingDeleteStudent(student);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteStudent) return;
    try {
      await deleteStudent(pendingDeleteStudent.id);
      showToast("success", "Student deleted successfully.");
      if (editingId === pendingDeleteStudent.id) resetForm();
      await fetchStudents();
      setPendingDeleteStudent(null);
    } catch (err: unknown) {
      showToast("error", parseError(err));
    }
  };

  const renderForm = (isCreate: boolean) => (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Name *</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
          className="w-full rounded border p-2 dark:bg-slate-700 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Matricule *</span>
        <input
          type="text"
          value={form.matricule}
          onChange={(e) => setForm((prev) => ({ ...prev, matricule: e.target.value }))}
          required
          className="w-full rounded border p-2 dark:bg-slate-700 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-sm font-medium">Class</span>
        <select
          value={form.class_id}
          onChange={(e) => setForm((prev) => ({ ...prev, class_id: e.target.value }))}
          className="w-full rounded border p-2 dark:bg-slate-700 dark:text-white"
        >
          <option value="">No class</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={String(classItem.id)}>
              {classItem.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3 md:col-span-2">
        <p className="text-sm font-medium">
          Face Capture {isCreate ? "*" : "(optional, capture to replace existing face)"}
        </p>
        <div className="overflow-hidden rounded-lg border bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
        <div className="flex flex-wrap gap-2">
          {!cameraOn ? (
            <button
              type="button"
              onClick={startCamera}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Start Camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Stop Camera
            </button>
          )}
          <button
            type="button"
            onClick={captureFace}
            disabled={!cameraOn}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-700"
          >
            Capture Face
          </button>
          {capturedImage && (
            <button
              type="button"
              onClick={() => setCapturedImage("")}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Clear Capture
            </button>
          )}
        </div>
        {capturedImage && (
          <div>
            <p className="mb-2 text-sm text-gray-600 dark:text-slate-300">Captured preview:</p>
            <Image
              src={capturedImage}
              alt="Captured face preview"
              width={112}
              height={112}
              unoptimized
              className="h-28 w-28 rounded border object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : isCreate ? "Create Student" : "Update Student"}
        </button>
        {!isCreate && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );

  return (
    <Protected adminOnly>
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Students</h1>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Student
          </button>
        </div>

        {createModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-white p-5 shadow-lg dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Student</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    stopCamera();
                  }}
                  aria-label="Close create modal"
                  className="inline-flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
              {renderForm(true)}
            </div>
          </div>
        )}

        {editingId !== null && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-white p-5 shadow-lg dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Update Student</h2>
                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Close update modal"
                  className="inline-flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
              {renderForm(false)}
            </div>
          </div>
        )}

        {pendingDeleteStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-lg dark:bg-slate-800">
              <h2 className="text-lg font-semibold">Confirm Delete</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Delete student {pendingDeleteStudent.name}? This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteStudent(null)}
                  className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold">Students List</h2>
          {loading ? (
            <LoadingSpinner label="Loading students..." />
          ) : students.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-lg border text-sm sm:text-base">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left sm:px-4">Name</th>
                    <th className="px-3 py-2 text-left sm:px-4">Matricule</th>
                    <th className="px-3 py-2 text-left sm:px-4">Class</th>
                    <th className="px-3 py-2 text-left sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="px-3 py-2 sm:px-4">{student.name}</td>
                      <td className="px-3 py-2 sm:px-4">{student.matricule}</td>
                      <td className="px-3 py-2 sm:px-4">
                        {student.class_id ? classNameById.get(student.class_id) ?? "-" : "-"}
                      </td>
                      <td className="px-3 py-2 sm:px-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(student)}
                            className="rounded border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDelete(student)}
                            className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
