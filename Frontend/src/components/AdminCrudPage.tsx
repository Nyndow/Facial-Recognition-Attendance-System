"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";

export type CrudFieldType = "text" | "number" | "password" | "checkbox" | "datetime-local";

export interface CrudField {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  requiredOnCreate?: boolean;
  placeholder?: string;
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
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
    setError("");
    setMessage("");
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
    setError("");
    try {
      const res = await api.get(endpoint);
      const rows = Array.isArray(res.data) ? (res.data as Row[]) : [];
      setItems(rows);
    } catch (err: unknown) {
      setError(parseError(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

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

      if (field.type === "datetime-local") {
        payload[field.key] = new Date(value).toISOString();
        return;
      }

      payload[field.key] = value;
    });

    return payload;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const isCreate = editingId === null;
      const payload = buildPayload(isCreate);
      if (isCreate) {
        await api.post(endpoint, payload);
        setMessage(`${title} created successfully.`);
        setCreateModalOpen(false);
      } else {
        await api.put(`${endpoint}/${editingId}`, payload);
        setMessage(`${title} updated successfully.`);
      }
      resetForm();
      await loadItems();
    } catch (err: unknown) {
      setError(parseError(err));
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
    setMessage("");
    setError("");
  };

  const handleDelete = async (row: Row) => {
    const idValue = row[resolvedIdKey];
    if (typeof idValue !== "string" && typeof idValue !== "number") return;
    if (!window.confirm(`Delete this ${title.toLowerCase()} entry?`)) return;

    setError("");
    setMessage("");
    try {
      await api.delete(`${endpoint}/${idValue}`);
      setMessage(`${title} deleted successfully.`);
      await loadItems();
      if (editingId === idValue) resetForm();
    } catch (err: unknown) {
      setError(parseError(err));
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
      <div className="md:col-span-2 flex gap-3">
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-700">
          {message}
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border bg-white dark:bg-gray-800 shadow-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create {title}</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded border px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            {renderForm(true)}
          </div>
        </div>
      )}

      {editingId !== null && (
        <div className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Update {title}</h2>
          {renderForm(false)}
        </div>
      )}

      <div className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4">{title} List</h2>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-2 text-left">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left">Actions</th>
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
                        <td key={column.key} className="px-4 py-2">
                          {renderedValue || "-"}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="rounded border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
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
  );
}
