"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ImportHistory from "@/components/ingestion/ImportHistory";
import DataFreshnessIndicator from "@/components/sales/DataFreshnessIndicator";
import ManualSalesEntry from "@/components/sales/ManualSalesEntry";
import SalesDataImporter from "@/components/sales/SalesDataImporter";

const TABS = [
  { key: "import", label: "Import file" },
  { key: "manual", label: "Manual entry" },
  { key: "history", label: "Import history" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string): value is TabKey {
  return TABS.some((tab) => tab.key === value);
}

export default function StoreDataPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params?.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>("import");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && isTabKey(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const historyUrl = useMemo(
    () => `/api/v1/sales/import/history?store_id=${storeId}`,
    [storeId],
  );

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="flex w-full flex-col gap-6">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">Store data management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import files or enter manual sales records for this store.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-white text-gray-500 hover:border-blue-600 hover:text-blue-600"
            }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "import" ? (
          <div className="space-y-6">
            <DataFreshnessIndicator lastUpdated={null} />
            <SalesDataImporter storeId={storeId} />
          </div>
        ) : null}

        {activeTab === "manual" ? <ManualSalesEntry storeId={storeId} /> : null}

        {activeTab === "history" ? <ImportHistory title="Sales import history" fetchUrl={historyUrl} /> : null}
      </div>
    </main>
  );
}
