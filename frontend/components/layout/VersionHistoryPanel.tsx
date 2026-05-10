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
        className={`absolute right-0 top-0 h-full w-full max-w-sm transform border-l border-gray-200 bg-white p-6 shadow-md transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">History</p>
            <h3 className="mt-1 text-base font-semibold text-gray-900">
              Planogram Versions
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">No saved versions yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version {version.version_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRestore(version.id)}
                    className="rounded-md border border-blue-600 bg-white px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
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
