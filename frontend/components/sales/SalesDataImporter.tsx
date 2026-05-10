"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import FileUploader from "@/components/ingestion/FileUploader";
import ImportSummaryCard from "@/components/ingestion/ImportSummaryCard";
import type { ImportSummaryResponse } from "@/components/ingestion/types";

interface SalesDataImporterProps {
  storeId: string;
  onImported?: () => void;
}

const SAMPLE_CSV = `sku,units_sold,revenue
SKU-001,240,716.80
SKU-002,180,268.20
SKU-003,95,332.50
`;

export default function SalesDataImporter({ storeId, onImported }: SalesDataImporterProps) {
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const handleUpload = async (file: File) => {
    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams({ store_id: storeId });
      if (periodStart) {
        params.set("period_start", periodStart);
      }
      if (periodEnd) {
        params.set("period_end", periodEnd);
      }

      const response = await api.post<ImportSummaryResponse>(
        `/api/v1/sales/import?${params.toString()}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setSummary(response.data);
      if (onImported) {
        onImported();
      }
    } catch {
      setError("Unable to import sales data. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Reporting period</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          This period applies to all rows unless your file includes period_start and period_end columns.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-[var(--color-text-secondary)]">
            Period start
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-100)]"
            />
          </label>
          <label className="text-sm text-[var(--color-text-secondary)]">
            Period end
            <input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-100)]"
            />
          </label>
        </div>
      </section>

      <FileUploader
        onUpload={handleUpload}
        isUploading={isUploading}
        label="Import sales data"
        hint="CSV, Excel, or PDF with sku and revenue columns."
      />

      <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-primary)]">
          Format guide
        </summary>
        <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
          <p>Required columns: sku, revenue</p>
          <p className="mt-2">Optional columns: units_sold, period_start, period_end</p>
          <button
            type="button"
            onClick={downloadSample}
            className="mt-4 rounded-full border border-[var(--color-blue-600)] px-4 py-2 text-xs font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
          >
            Download sample CSV
          </button>
        </div>
      </details>

      {error ? (
        <p className="rounded-lg bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
          {error}
        </p>
      ) : null}

      {summary ? (
        <ImportSummaryCard
          summary={summary}
          onDismiss={() => setSummary(null)}
          onViewErrors={() => undefined}
        />
      ) : null}
    </div>
  );
}
