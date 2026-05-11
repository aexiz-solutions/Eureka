"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { PlanogramQualityWarning } from "@/types/planogram";

interface DataQualityBannerProps {
  warnings: PlanogramQualityWarning[];
}

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEVERITY_STYLES: Record<string, { container: string; chip: string; label: string }> = {
  high: {
    container: "border-yellow-200 bg-yellow-50 text-yellow-800",
    chip: "bg-yellow-100 text-yellow-800",
    label: "Action required",
  },
  medium: {
    container: "border-gray-200 bg-white text-gray-900",
    chip: "bg-yellow-100 text-yellow-800",
    label: "Warning",
  },
  low: {
    container: "border-gray-200 bg-white text-gray-900",
    chip: "bg-gray-100 text-gray-600",
    label: "Info",
  },
};

export default function DataQualityBanner({ warnings }: DataQualityBannerProps) {
  const router = useRouter();
  const [dismissedCodes, setDismissedCodes] = useState<Set<string>>(() => new Set());

  const sorted = useMemo(
    () =>
      [...warnings].sort(
        (a, b) =>
          (SEVERITY_RANK[a.severity?.toLowerCase()] ?? 9) -
          (SEVERITY_RANK[b.severity?.toLowerCase()] ?? 9),
      ),
    [warnings],
  );

  const visible = useMemo(
    () =>
      sorted.filter((warning) => {
        const severity = (warning.severity || "low").toLowerCase();
        if (severity === "high") {
          return true;
        }
        return !dismissedCodes.has(warning.code);
      }),
    [sorted, dismissedCodes],
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-24 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-[360px]">
      {visible.map((warning) => {
        const severity = (warning.severity || "low").toLowerCase();
        const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
        const dismissible = severity !== "high";

        return (
          <div
            key={`${warning.code}-${warning.action_url}`}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles.container}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.chip}`}
              >
                {styles.label}
              </span>
              <p className="min-w-0 flex-1">{warning.message}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(warning.action_url)}
                className="rounded-md border border-blue-600 bg-white px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                {warning.action_label || "Fix"}
              </button>
              {dismissible ? (
                <button
                  type="button"
                  onClick={() =>
                    setDismissedCodes((prev) => {
                      const next = new Set(prev);
                      next.add(warning.code);
                      return next;
                    })
                  }
                  className="rounded-md bg-transparent px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Dismiss"
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
