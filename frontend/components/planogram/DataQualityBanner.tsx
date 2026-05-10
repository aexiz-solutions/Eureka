"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { PlanogramQualityWarning } from "@/types/planogram";

interface DataQualityBannerProps {
  warnings: PlanogramQualityWarning[];
}

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEVERITY_STYLES: Record<string, { container: string; chip: string; label: string }> = {
  high: {
    container: "border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)]",
    chip: "bg-[var(--color-status-red-text)] text-white",
    label: "Action Required",
  },
  medium: {
    container: "border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)]",
    chip: "bg-[var(--color-status-yellow-text)] text-white",
    label: "Heads Up",
  },
  low: {
    container: "border-[var(--color-border)] bg-[var(--color-bg-muted)]",
    chip: "bg-[var(--color-bg)] text-[var(--color-text-secondary)]",
    label: "FYI",
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
    <div className="space-y-2">
      {visible.map((warning) => {
        const severity = (warning.severity || "low").toLowerCase();
        const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
        const dismissible = severity !== "high";

        return (
          <div
            key={`${warning.code}-${warning.action_url}`}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${styles.container}`}
          >
            <span
              className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles.chip}`}
            >
              {styles.label}
            </span>
            <p className="flex-1 text-sm text-[var(--color-text-primary)]">{warning.message}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(warning.action_url)}
                className="rounded-full border border-[var(--color-blue-600)] bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
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
                  className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
