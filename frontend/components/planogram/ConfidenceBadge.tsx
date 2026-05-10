"use client";

import { useState } from "react";

import type { PlanogramConfidence } from "@/types/planogram";

interface ConfidenceBadgeProps {
  confidence: PlanogramConfidence | null;
}

const TIER_STYLES: Record<string, { label: string; pill: string; bar: string }> = {
  high: {
    label: "High Confidence",
    pill: "bg-green-100 text-green-700",
    bar: "health-progress-blue",
  },
  medium: {
    label: "Medium Confidence",
    pill: "bg-yellow-100 text-yellow-800",
    bar: "health-progress-yellow",
  },
  low: {
    label: "Low Confidence - Draft",
    pill: "bg-red-100 text-red-800",
    bar: "health-progress-red",
  },
};

function CoverageRow({ label, value, barColor }: { label: string; value: number; barColor: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <span className="w-32 shrink-0">{label}</span>
      <progress className={`health-progress flex-1 ${barColor}`} value={pct} max={100}>
        {pct.toFixed(0)}%
      </progress>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-gray-600">{pct.toFixed(0)}%</span>
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
  const indicator = tier === "high" ? "OK" : "!";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.pill}`}
      >
        <span aria-hidden>{indicator}</span>
        <span>{style.label}</span>
        <span className="font-mono text-xs opacity-80">{confidence.score.toFixed(2)}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Confidence breakdown"
          className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Confidence breakdown</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-transparent px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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

          <p className="mt-3 text-xs leading-relaxed text-gray-500">
            Score is a weighted blend of these four signals. Improve the weakest input first to lift the
            tier.
          </p>
        </div>
      ) : null}
    </div>
  );
}
