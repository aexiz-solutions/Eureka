"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ImportHistory from "@/components/ingestion/ImportHistory";
import ProductImporter from "@/components/products/ProductImporter";
import SalesDataImporter from "@/components/sales/SalesDataImporter";
import StoresImporter from "@/components/stores/StoresImporter";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Tab = "products" | "sales" | "stores";

interface StoreSummary {
  id: string;
  raw_name: string;
  display_name: string | null;
}

interface StoreListResponse {
  data: StoreSummary[];
  total: number;
}

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "products", label: "Products" },
  { key: "sales", label: "Sales" },
  { key: "stores", label: "Stores" },
];

export default function UploadPage() {
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [storeRefreshKey, setStoreRefreshKey] = useState(0);
  const [salesStoreId, setSalesStoreId] = useState<string>("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get<StoreListResponse>("/api/v1/stores");
        if (cancelled) return;
        setStores(response.data.data ?? []);
        if (!salesStoreId && response.data.data?.[0]) {
          setSalesStoreId(response.data.data[0].id);
        }
      } catch (err) {
        if (!cancelled) setStores([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [salesStoreId, storeRefreshKey]);

  const refreshStores = () => setStoreRefreshKey((value) => value + 1);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Upload</h1>
            <p className="mt-1 text-sm text-gray-500">
              Import products, sales, and stores for planogram generation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Go to Dashboard
          </button>
        </header>

        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "products" ? (
          <>
            <ProductImporter />
            <ImportHistory title="Product import history" fetchUrl="/api/v1/products/import/history" />
          </>
        ) : null}

        {activeTab === "sales" ? (
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Upload sales by store</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Sales data must be tied to a specific store. Pick a store, set the period, and upload.
              </p>

              {stores.length === 0 ? (
                <p className="mt-4 rounded-md border border-yellow-200 bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
                  Upload at least one store in the Stores tab before uploading sales.
                </p>
              ) : (
                <div className="mt-4 max-w-md">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Store
                  </label>
                  <select
                    value={salesStoreId}
                    onChange={(event) => setSalesStoreId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.display_name ?? store.raw_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {salesStoreId ? <SalesDataImporter storeId={salesStoreId} /> : null}

            {salesStoreId ? (
              <ImportHistory
                title="Sales import history"
                fetchUrl={`/api/v1/sales/import/history?store_id=${salesStoreId}`}
              />
            ) : null}
          </section>
        ) : null}

        {activeTab === "stores" ? (
          <>
            <StoresImporter onImported={refreshStores} />
            <ImportHistory title="Store import history" fetchUrl="/api/v1/stores/import/history" />
          </>
        ) : null}
      </div>
    </main>
  );
}
