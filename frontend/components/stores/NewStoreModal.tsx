"use client";

import axios from "axios";
import { FormEvent, useEffect, useState } from "react";

import { api } from "@/lib/api";

export type StoreType = "supermarket" | "convenience" | "specialty";

export interface StoreRecord {
  id: string;
  name: string;
  width_m: number;
  height_m: number;
  store_type: StoreType;
  created_at: string;
  updated_at: string;
}

interface NewStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (store: StoreRecord) => void | Promise<void>;
}

const DEFAULT_FORM = {
  name: "",
  store_type: "supermarket" as StoreType,
  width_m: 50,
  height_m: 30,
};

const inputClasses =
  "mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500";

export default function NewStoreModal({ isOpen, onClose, onCreated }: NewStoreModalProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(DEFAULT_FORM);
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post<StoreRecord>("/api/v1/stores", {
        name: form.name.trim(),
        store_type: form.store_type,
        width_m: Number(form.width_m),
        height_m: Number(form.height_m),
      });
      await onCreated(response.data);
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail.trim().length > 0) {
          setError(detail);
        } else {
          setError("Unable to create store. Check the fields and try again.");
        }
      } else if (err instanceof Error && err.message.trim().length > 0) {
        setError(err.message);
      } else {
        setError("Unable to create store. Check the fields and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">New store</p>
            <h2 className="mt-1 text-base font-semibold text-gray-900">Create store</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-gray-500">
            Store name
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className={inputClasses}
            />
          </label>

          <label className="block text-sm text-gray-500">
            Store type
            <select
              value={form.store_type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, store_type: event.target.value as StoreType }))
              }
              className={inputClasses}
            >
              <option value="supermarket">Supermarket</option>
              <option value="convenience">Convenience</option>
              <option value="specialty">Specialty</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-gray-500">
              Width (m)
              <input
                type="number"
                min={1}
                max={1000}
                value={form.width_m}
                onChange={(event) => setForm((prev) => ({ ...prev, width_m: event.target.valueAsNumber }))}
                className={inputClasses}
              />
            </label>
            <label className="block text-sm text-gray-500">
              Height (m)
              <input
                type="number"
                min={1}
                max={1000}
                value={form.height_m}
                onChange={(event) => setForm((prev) => ({ ...prev, height_m: event.target.valueAsNumber }))}
                className={inputClasses}
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating store..." : "Create store"}
          </button>
        </form>
      </div>
    </div>
  );
}
