"use client";

import { FormEvent, useState } from "react";

import { api } from "@/lib/api";

interface ManualSalesEntryProps {
  storeId: string;
}

const inputClasses =
  "mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500";

export default function ManualSalesEntry({ storeId }: ManualSalesEntryProps) {
  const [sku, setSku] = useState("");
  const [unitsSold, setUnitsSold] = useState("");
  const [revenue, setRevenue] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/api/v1/sales", {
        store_id: storeId,
        sku: sku.trim(),
        units_sold: unitsSold ? Number(unitsSold) : null,
        revenue: Number(revenue),
        period_start: periodStart,
        period_end: periodEnd,
      });
      setSuccess("Sales entry saved.");
      setSku("");
      setUnitsSold("");
      setRevenue("");
    } catch {
      setError("Unable to save sales entry. Please check the fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-900">Manual sales entry</p>
        <p className="mt-1 text-xs text-gray-500">Enter a single SKU record for this store.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-gray-500">
          SKU
          <input
            type="text"
            required
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="text-sm text-gray-500">
          Units sold (optional)
          <input
            type="number"
            min={0}
            value={unitsSold}
            onChange={(event) => setUnitsSold(event.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      <label className="text-sm text-gray-500">
        Revenue
        <input
          type="number"
          min={0}
          step="0.01"
          required
          value={revenue}
          onChange={(event) => setRevenue(event.target.value)}
          className={inputClasses}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-gray-500">
          Period start
          <input
            type="date"
            required
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="text-sm text-gray-500">
          Period end
          <input
            type="date"
            required
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-green-200 bg-green-100 px-3 py-2 text-sm text-green-600">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save entry"}
      </button>
    </form>
  );
}
