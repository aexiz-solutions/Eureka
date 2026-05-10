"use client";

interface DataFreshnessIndicatorProps {
  lastUpdated: string | null;
  onRefresh?: () => void;
}

export default function DataFreshnessIndicator({ lastUpdated, onRefresh }: DataFreshnessIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Sales data freshness
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {lastUpdated ? `Last updated: ${lastUpdated}` : "No sales data uploaded yet."}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Data is static until you import or enter new sales records.
        </p>
      </div>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-blue-600 bg-white px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Refresh
        </button>
      ) : null}
    </div>
  );
}
