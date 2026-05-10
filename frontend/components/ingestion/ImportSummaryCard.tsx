"use client";

import { useMemo, useState } from "react";

import type { ImportSummaryResponse } from "./types";

interface ImportSummaryCardProps {
  summary: ImportSummaryResponse;
  onDismiss: () => void;
  onViewErrors?: () => void;
}

const STATUS_STYLES: Record<ImportSummaryResponse["status"], string> = {
  completed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Import summary</p>
          <h3 className="mt-1 text-base font-semibold text-gray-900">{summary.original_filename}</h3>
          <p className="mt-0.5 text-xs text-gray-500">Format: {summary.file_format.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[summary.status]}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total rows</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total_rows}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Imported</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{summary.success}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Errors</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{summary.errors.length}</p>
        </div>
      </div>

      {summary.period_start && summary.period_end ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Period: {summary.period_start} to {summary.period_end}
        </div>
      ) : null}

      {summary.unmatched_skus && summary.unmatched_skus.length > 0 ? (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          {summary.unmatched_skus.length} SKUs did not match your product catalog. Sales data was imported but
          will not appear in planogram analytics until products are added.
        </div>
      ) : null}

      {summary.potential_duplicates && summary.potential_duplicates.length > 0 ? (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Possible duplicate products ({summary.potential_duplicates.length})</p>
            <button
              type="button"
              onClick={() => setShowDuplicates((prev) => !prev)}
              className="text-xs font-medium text-yellow-800 underline underline-offset-2"
            >
              {showDuplicates ? "Hide details" : "Review details"}
            </button>
          </div>
          <p className="mt-1 text-xs text-yellow-800">
            These SKUs may refer to the same product. Review manually before downstream planning.
          </p>
          {showDuplicates ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Existing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Imported
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Match %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.potential_duplicates.map((duplicate) => (
                    <tr key={`${duplicate.sku_a}-${duplicate.sku_b}-${duplicate.row_b}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {duplicate.name_a} ({duplicate.sku_a})
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {duplicate.name_b} ({duplicate.sku_b})
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
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
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showErrors ? "Hide errors" : "View errors"}
          </button>
          {showErrors ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.errors.map((error) => (
                    <tr key={`${error.row}-${error.reason}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{error.row}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{error.reason}</td>
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
