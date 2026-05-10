"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Planogram, PlanogramListResponse } from "@/types/planogram";

interface DataHealthWidgetProps {
  storeId: string;
  storeName: string;
}

interface HealthMetrics {
  sales: number;
  dimensions: number;
  categories: number;
  tier: string;
  planogramId: string;
}

const NEEDS_ATTENTION_THRESHOLD = 50;

function HealthBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 50
      ? "health-progress-blue"
      : pct >= 25
        ? "health-progress-yellow"
        : "health-progress-red";

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-20 shrink-0">{label}</span>
      <progress className={`health-progress flex-1 ${color}`} value={pct} max={100}>
        {pct.toFixed(0)}%
      </progress>
      <span className="w-9 shrink-0 text-right font-mono text-xs text-gray-600">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function DataHealthWidget({ storeId, storeName }: DataHealthWidgetProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get<PlanogramListResponse>(
          `/api/v1/planograms?store_id=${storeId}`,
        );
        if (cancelled) return;
        const latest: Planogram | undefined = response.data.data[0];
        if (!latest) {
          setMetrics(null);
          return;
        }
        const confidence = latest.planogram_json?.confidence;
        if (!confidence) {
          setMetrics(null);
          return;
        }
        setMetrics({
          sales: Number(confidence.sales_coverage_pct) || 0,
          dimensions: Number(confidence.dimension_coverage_pct) || 0,
          categories: Number(confidence.category_coverage_pct) || 0,
          tier: String(confidence.tier ?? "unknown").toLowerCase(),
          planogramId: latest.id,
        });
      } catch (err) {
        if (!cancelled) setMetrics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const needsAttention =
    metrics &&
    (metrics.sales < NEEDS_ATTENTION_THRESHOLD ||
      metrics.dimensions < NEEDS_ATTENTION_THRESHOLD ||
      metrics.categories < NEEDS_ATTENTION_THRESHOLD);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{storeName}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Data health</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/stores/${storeId}/planogram/latest`)}
          className="rounded-md border border-blue-600 bg-white px-2.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Open
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {loading ? (
          <p className="text-xs text-gray-500">Checking...</p>
        ) : metrics ? (
          <>
            <HealthBar label="Sales data" value={metrics.sales} />
            <HealthBar label="Dimensions" value={metrics.dimensions} />
            <HealthBar label="Categories" value={metrics.categories} />
            <p className="pt-1 text-xs text-gray-500">
              Confidence: <span className="font-medium text-gray-900">{metrics.tier}</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-500">No planogram generated yet.</p>
        )}
      </div>

      {needsAttention ? (
        <button
          type="button"
          onClick={() => router.push(`/stores/${storeId}/data`)}
          className="mt-3 w-full rounded-md border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 transition-colors hover:bg-yellow-100"
        >
          Improve data
        </button>
      ) : null}
    </div>
  );
}
