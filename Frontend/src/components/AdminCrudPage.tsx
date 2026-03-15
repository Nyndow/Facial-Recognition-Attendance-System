"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import ToastStack, { ToastItem, ToastType } from "@/components/ToastStack";
import LoadingSpinner from "@/components/LoadingSpinner";
import { X, Edit, Trash2 } from "lucide-react";

export type CrudFieldType =
  | "text"
  | "number"
  | "password"
  | "checkbox"
  | "datetime-local"
  | "select";

export interface CrudSelectOption {
  label: string;
  value: string | number;
}

export interface CrudField {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  requiredOnCreate?: boolean;
  placeholder?: string;
  options?: CrudSelectOption[];
  optionPlaceholder?: string;
  valueType?: "string" | "number";
}

export interface CrudColumn {
  key: string;
  label: string;
}

interface AdminCrudPageProps {
  title: string;
  endpoint: string;
  idKey?: string;
  columns: CrudColumn[];
  fields: CrudField[];
}

type Row = Record<string, unknown>;
type FieldValue = string | boolean;
type FormState = Record<string, FieldValue>;

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toDatetimeLocalValue = (value: unknown): string => {
  if (!value) return "";
  const raw = String(value);

  // If the backend returns a "naive" local ISO string, keep it as-is.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/(Z|[+-]\d{2}:\d{2})$/.test(raw)) {
    return raw.slice(0, 16);
  }

  // If the value includes a timezone, convert to local for the input.
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
};

const normalizeDatetimeLocal = (value: string): string => {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
};

const buildInitialForm = (fields: CrudField[]): FormState =>
  fields.reduce<FormState>((acc, field) => {
    acc[field.key] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});

const inferIdKey = (firstRow: Row | undefined): string => {
  if (!firstRow) return "id";
  if ("id" in firstRow) return "id";
  if ("idRoom" in firstRow) return "idRoom";
  if ("idCamera" in firstRow) return "idCamera";
  return "id";
};

export default function AdminCrudPage({
  title,
  endpoint,
  idKey,
  columns,
  fields,
}: AdminCrudPageProps) {
  const [items, setItems] = useState<Row[]>([]);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(fields));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);

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

  const resolvedIdKey = useMemo(
    () => (idKey ? idKey : inferIdKey(items[0])),
    [idKey, items]
  );

  const resetForm = () => {
    setForm(buildInitialForm(fields));
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const parseError = (err: unknown): string => {
    const axiosError = err as AxiosError<{ error?: string; message?: string }>;
    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message ||
      "Request failed"
    );
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      const rows = Array.isArray(res.data) ? (res.data as Row[]) : [];
      setItems(rows);
    } catch (err: unknown) {
      showToast("error", parseError(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const setFieldValue = (field: CrudField, value: FieldValue) => {
    setForm((prev) => ({ ...prev, [field.key]: value }));
  };

  const buildPayload = (isCreate: boolean): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    fields.forEach((field) => {
      const rawValue = form[field.key];

      if (field.type === "checkbox") {
        payload[field.key] = Boolean(rawValue);
        return;
      }

      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) {
        if (isCreate) {
          if (field.required || field.requiredOnCreate) {
            payload[field.key] = value;
          }
        } else if (!field.requiredOnCreate) {
          payload[field.key] = null;
        }
        return;
      }

      if (field.type === "number") {
        payload[field.key] = Number(value);
        return;
      }

      if (field.type === "select") {
        if (field.valueType === "number") {
          payload[field.key] = Number(value);
        } else {
          payload[field.key] = value;
        }
        return;
      }

      if (field.type === "datetime-local") {
        // Keep datetime-local in local time (no timezone shift).
        payload[field.key] = normalizeDatetimeLocal(value);
        return;
      }

      payload[field.key] = value;
    });

    return payload;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isCreate = editingId === null;
      const payload = buildPayload(isCreate);
      if (isCreate) {
        await api.post(endpoint, payload);
        showToast("success", `${title} created successfully.`);
        setCreateModalOpen(false);
      } else {
        await api.put(`${endpoint}/${editingId}`, payload);
        showToast("success", `${title} updated successfully.`);
      }
      resetForm();
      await loadItems();
    } catch (err: unknown) {
      showToast("error", parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: Row) => {
    const idValue = row[resolvedIdKey];
    if (typeof idValue !== "string" && typeof idValue !== "number") return;

    const nextForm = buildInitialForm(fields);
    fields.forEach((field) => {
      const rowValue = row[field.key];
      if (field.type === "checkbox") {
        nextForm[field.key] = Boolean(rowValue);
      } else if (field.type === "datetime-local") {
        nextForm[field.key] = toDatetimeLocalValue(rowValue);
      } else {
        nextForm[field.key] = toStringValue(rowValue);
      }
    });
    setForm(nextForm);
    setEditingId(idValue);
    setCreateModalOpen(false);
  };

  const promptDelete = (row: Row) => {
    const idValue = row[resolvedIdKey];
    if (typeof idValue !== "string" && typeof idValue !== "number") return;
    setPendingDeleteId(idValue);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      await api.delete(`${endpoint}/${pendingDeleteId}`);
      showToast("success", `${title} deleted successfully.`);
      await loadItems();
      if (editingId === pendingDeleteId) resetForm();
      setPendingDeleteId(null);
    } catch (err: unknown) {
      showToast("error", parseError(err));
    }
  };

  const renderForm = (isCreate: boolean) => (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {field.label}
            {(field.required || (isCreate && field.requiredOnCreate)) && " *"}
          </span>
          {field.type === "checkbox" ? (
            <input
              type="checkbox"
              checked={Boolean(form[field.key])}
              onChange={(e) => setFieldValue(field, e.target.checked)}
              className="h-4 w-4"
            />
          ) : field.type === "select" ? (
            <select
              value={toStringValue(form[field.key])}
              onChange={(e) => setFieldValue(field, e.target.value)}
              required={Boolean(field.required || (isCreate && field.requiredOnCreate))}
              className="w-full rounded border p-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{field.optionPlaceholder ?? "Select an option"}</option>
              {(field.options ?? []).map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={toStringValue(form[field.key])}
              onChange={(e) => setFieldValue(field, e.target.value)}
              placeholder={field.placeholder}
              required={Boolean(field.required || (isCreate && field.requiredOnCreate))}
              className="w-full rounded border p-2 dark:bg-gray-700 dark:text-white"
            />
          )}
        </label>
      ))}
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : isCreate ? `Create ${title}` : `Update ${title}`}
        </button>
        {!isCreate && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
        >
          Create
        </button>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-white p-5 shadow-lg dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Create {title}</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close create modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-white p-5 shadow-lg dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Update {title}</h2>
              <button
                type="button"
                onClick={resetForm}
                aria-label="Close update modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            {renderForm(false)}
          </div>
        </div>
      )}

      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Confirm Delete</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Delete this {title.toLowerCase()} entry? This action cannot be undone.
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
                onClick={() => setPendingDeleteId(null)}
                className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold">{title} List</h2>
        {loading ? (
          <LoadingSpinner label={`Loading ${title.toLowerCase()}...`} />
        ) : items.length === 0 ? (
          <p>No data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-lg border text-sm sm:text-base">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-3 py-2 text-left sm:px-4">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={`${toStringValue(row[resolvedIdKey])}-${idx}`} className="border-b">
                    {columns.map((column) => {
                      const value = row[column.key];
                      const renderedValue =
                        typeof value === "boolean" ? (value ? "Yes" : "No") : toStringValue(value);
                      return (
                        <td key={column.key} className="px-3 py-2 align-top sm:px-4">
                          {renderedValue || "-"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 sm:px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="inline-flex items-center justify-center rounded border p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDelete(row)}
                          className="inline-flex items-center justify-center rounded border border-red-300 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
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
  );
}
