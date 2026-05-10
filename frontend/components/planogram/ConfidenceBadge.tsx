"use client";

import { useState } from "react";

import type { PlanogramConfidence } from "@/types/planogram";

interface ConfidenceBadgeProps {
  confidence: PlanogramConfidence | null;
}

const TIER_STYLES: Record<string, { label: string; pill: string; bar: string }> = {
  high: {
    label: "High Confidence",
    pill:
      "bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)] border-[var(--color-status-green-text)]",
    bar: "bg-[var(--color-status-green-text)]",
  },
  medium: {
    label: "Medium Confidence",
    pill:
      "bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)] border-[var(--color-status-yellow-text)]",
    bar: "bg-[var(--color-status-yellow-text)]",
  },
  low: {
    label: "Low Confidence — Draft",
    pill:
      "bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)] border-[var(--color-status-red-text)]",
    bar: "bg-[var(--color-status-red-text)]",
  },
};

function CoverageRow({ label, value, barColor }: { label: string; value: number; barColor: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
      <span className="w-32 shrink-0">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-[11px]">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!confidence) {
    return null;
  }

  const tier = (confidence.tier || "low").toLowerCase();
  const style = TIER_STYLES[tier] ?? TIER_STYLES.low;
  const indicator = tier === "high" ? "✓" : "⚠";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${style.pill}`}
      >
        <span aria-hidden>{indicator}</span>
        <span>{style.label}</span>
        <span className="font-mono text-[11px] opacity-80">{confidence.score.toFixed(2)}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Confidence breakdown"
          className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Confidence Breakdown</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Close
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <CoverageRow label="Sales data" value={confidence.sales_coverage_pct} barColor={style.bar} />
            <CoverageRow label="Dimensions" value={confidence.dimension_coverage_pct} barColor={style.bar} />
            <CoverageRow label="Categories" value={confidence.category_coverage_pct} barColor={style.bar} />
            <CoverageRow
              label="Store accuracy"
              value={confidence.store_parse_confidence * 100}
              barColor={style.bar}
            />
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            Score is a weighted blend of these four signals. Improve the weakest input first to lift the
            tier.
          </p>
        </div>
      ) : null}
    </div>
  );
}
