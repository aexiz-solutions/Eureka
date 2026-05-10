"use client";

import { useMemo, useState } from "react";

import type { ImportSummaryResponse } from "./types";

interface ImportSummaryCardProps {
  summary: ImportSummaryResponse;
  onDismiss: () => void;
  onViewErrors?: () => void;
}

const STATUS_STYLES: Record<ImportSummaryResponse["status"], string> = {
  completed: "bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]",
  partial: "bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)]",
  failed: "bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]",
};

export default function ImportSummaryCard({ summary, onDismiss, onViewErrors }: ImportSummaryCardProps) {
  const [showErrors, setShowErrors] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const statusLabel = useMemo(() => {
    if (summary.status === "completed") {
      return "Completed";
    }
    if (summary.status === "partial") {
      return "Partial";
    }
    return "Failed";
  }, [summary.status]);

  const handleToggleErrors = () => {
    const next = !showErrors;
    setShowErrors(next);
    if (next && onViewErrors) {
      onViewErrors();
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Import summary</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
            {summary.original_filename}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Format: {summary.file_format.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[summary.status]}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-[var(--color-blue-600)] px-3 py-1 text-xs text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
          <p className="text-xs text-[var(--color-text-secondary)]">Total rows</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{summary.total_rows}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
          <p className="text-xs text-[var(--color-text-secondary)]">Imported</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{summary.success}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
          <p className="text-xs text-[var(--color-text-secondary)]">Errors</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{summary.errors.length}</p>
        </div>
      </div>

      {summary.period_start && summary.period_end ? (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Period: {summary.period_start} to {summary.period_end}
        </div>
      ) : null}

      {summary.unmatched_skus && summary.unmatched_skus.length > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] px-4 py-3 text-sm text-[var(--color-status-yellow-text)]">
          {summary.unmatched_skus.length} SKUs did not match your product catalog. Sales data was imported but
          will not appear in planogram analytics until products are added.
        </div>
      ) : null}

      {summary.potential_duplicates && summary.potential_duplicates.length > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] px-4 py-3 text-sm text-[var(--color-status-yellow-text)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              Possible Duplicate Products Detected ({summary.potential_duplicates.length})
            </p>
            <button
              type="button"
              onClick={() => setShowDuplicates((prev) => !prev)}
              className="text-xs font-semibold text-[var(--color-status-yellow-text)] underline underline-offset-2"
            >
              {showDuplicates ? "Hide details" : "Review details"}
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--color-status-yellow-text)]">
            These SKUs may refer to the same product. Review manually before downstream planning.
          </p>
          {showDuplicates ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-bg-muted)] text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-3 py-2">Existing</th>
                    <th className="px-3 py-2">Imported</th>
                    <th className="px-3 py-2">Match %</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.potential_duplicates.map((duplicate) => (
                    <tr
                      key={`${duplicate.sku_a}-${duplicate.sku_b}-${duplicate.row_b}`}
                      className="border-t border-[var(--color-border)]"
                    >
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                        {duplicate.name_a} ({duplicate.sku_a})
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                        {duplicate.name_b} ({duplicate.sku_b})
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                        {Math.round(duplicate.similarity)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {summary.errors.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleToggleErrors}
            className="text-sm font-semibold text-[var(--color-blue-600)] hover:text-[var(--color-blue-700)]"
          >
            {showErrors ? "Hide errors" : "View errors"}
          </button>
          {showErrors ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-bg-muted)] text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.errors.map((error) => (
                    <tr key={`${error.row}-${error.reason}`} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{error.row}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{error.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
