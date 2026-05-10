"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

import type { ImportLogResponse } from "./types";

interface ImportHistoryProps {
  title: string;
  fetchUrl: string;
}

const STATUS_STYLES: Record<ImportLogResponse["status"], string> = {
  completed: "bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]",
  partial: "bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)]",
  failed: "bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]",
};

const FORMAT_LABELS: Record<ImportLogResponse["file_format"], string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
};

export default function ImportHistory({ title, fetchUrl }: ImportHistoryProps) {
  const [rows, setRows] = useState<ImportLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasRows = rows.length > 0;

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<ImportLogResponse[]>(fetchUrl);
        if (mounted) {
          setRows(response.data);
        }
      } catch {
        if (mounted) {
          setError("Unable to load import history.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      mounted = false;
    };
  }, [fetchUrl]);

  const formatDate = useMemo(
    () => (value: string) => new Date(value).toLocaleString(),
    [],
  );

  if (loading) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Loading import history...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
        {error}
      </p>
    );
  }

  if (!hasRows) {
    return <p className="text-sm text-[var(--color-text-secondary)]">No imports recorded yet.</p>;
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--color-bg-muted)] text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Format</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Rows</th>
              <th className="px-3 py-2">Success</th>
              <th className="px-3 py-2">Errors</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">{formatDate(row.imported_at)}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--color-text-primary)]">
                      {row.original_filename}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">
                      {FORMAT_LABELS[row.file_format]}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.import_type}</td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.total_rows}</td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.success_count}</td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.error_count}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]">
                      <td colSpan={8} className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        {row.error_detail && row.error_detail.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                              Errors
                            </p>
                            <ul className="space-y-1">
                              {row.error_detail.map((errorRow) => (
                                <li key={`${row.id}-${errorRow.row}-${errorRow.reason}`}>
                                  Row {errorRow.row}: {errorRow.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p>No error details recorded.</p>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
