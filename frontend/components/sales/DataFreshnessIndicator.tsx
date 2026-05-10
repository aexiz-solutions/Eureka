"use client";

interface DataFreshnessIndicatorProps {
  lastUpdated: string | null;
  onRefresh?: () => void;
}

export default function DataFreshnessIndicator({ lastUpdated, onRefresh }: DataFreshnessIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Sales data freshness
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {lastUpdated ? `Last updated: ${lastUpdated}` : "No sales data uploaded yet."}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Data is static until you import or enter new sales records.
        </p>
      </div>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-[var(--color-blue-600)] px-4 py-2 text-xs font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
        >
          Refresh
        </button>
      ) : null}
    </div>
  );
}
