"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type {
  Planogram,
  PlanogramVersionListResponse,
  PlanogramVersionSummary,
} from "@/types/planogram";

interface VersionHistoryPanelProps {
  planogramId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRestored: (planogram: Planogram) => void;
}

export default function VersionHistoryPanel({
  planogramId,
  isOpen,
  onClose,
  onRestored,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<PlanogramVersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !planogramId) {
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<PlanogramVersionListResponse>(
          `/api/v1/planograms/${planogramId}/versions`,
        );
        setVersions(response.data.data);
      } catch {
        setError("Unable to load version history.");
      } finally {
        setLoading(false);
      }
    };

    void fetchVersions();
  }, [isOpen, planogramId]);

  const handleRestore = async (versionId: string) => {
    if (!planogramId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post<Planogram>(
        `/api/v1/planograms/${planogramId}/rollback/${versionId}`,
      );
      onRestored(response.data);
      onClose();
    } catch {
      setError("Unable to restore this version.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-sm transform border-l border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">History</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
              Planogram Versions
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-blue-600)]"
          >
            Close
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">No saved versions yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Version {version.version_number}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRestore(version.id)}
                    className="rounded-lg border border-[var(--color-blue-600)] px-3 py-2 text-xs font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
