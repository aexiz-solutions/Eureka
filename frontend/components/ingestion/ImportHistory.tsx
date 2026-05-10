"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

import type { ImportLogResponse } from "./types";

interface ImportHistoryProps {
  title: string;
  fetchUrl: string;
}

const STATUS_STYLES: Record<ImportLogResponse["status"], string> = {
  completed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
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
    return <p className="text-sm text-gray-500">Loading import history...</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!hasRows) {
    return <p className="text-sm text-gray-500">No imports recorded yet.</p>;
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                File
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Format
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Rows
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Success
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Errors
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const isExpanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr className="hover:bg-gray-50" onClick={() => setExpandedId(isExpanded ? null : row.id)}>
                    <td className="px-4 py-4 text-xs text-gray-500">{formatDate(row.imported_at)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.original_filename}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{FORMAT_LABELS[row.file_format]}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{row.import_type}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{row.total_rows}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{row.success_count}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{row.error_count}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-3 text-sm text-gray-500">
                        {row.error_detail && row.error_detail.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
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
