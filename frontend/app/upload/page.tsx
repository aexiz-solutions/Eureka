"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProductImporter from "@/components/products/ProductImporter";
import SalesDataImporter from "@/components/sales/SalesDataImporter";
import StoresImporter from "@/components/stores/StoresImporter";
import ImportHistory from "@/components/ingestion/ImportHistory";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Tab = "stores" | "products" | "sales";

interface StoreSummary {
  id: string;
  raw_name: string;
  display_name: string | null;
}

interface StoreListResponse {
  data: StoreSummary[];
  total: number;
}

const TABS: Array<{ key: Tab; label: string; description: string }> = [
  {
    key: "stores",
    label: "1. Stores",
    description: "Upload the list of stores you operate. Eureka parses names into country → state → city.",
  },
  {
    key: "products",
    label: "2. Products",
    description: "Upload your product master so SKUs, dimensions, and categories are available for planograms.",
  },
  {
    key: "sales",
    label: "3. Sales",
    description: "Upload sales for any store to drive ranking, facing counts, and confidence scoring.",
  },
];

export default function UploadPage() {
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<Tab>("stores");
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

  const goToDashboard = () => router.push("/dashboard");

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <header className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                Data Ingestion
              </p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
                Welcome{user?.first_name ? `, ${user.first_name}` : ""} — let's get your data in.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                Eureka generates planograms from your existing data. Upload stores, products, and sales —
                in any order — then jump to the dashboard to see your store hierarchy and generate AI
                planograms.
              </p>
            </div>
            <button
              type="button"
              onClick={goToDashboard}
              className="rounded-full bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-blue-700)]"
            >
              Go to Dashboard →
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {TABS.map((tab) => {
              const completed =
                (tab.key === "stores" && stores.length > 0) ||
                (tab.key === "products" && false) ||
                (tab.key === "sales" && false);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[var(--color-blue-600)] bg-[var(--color-blue-100)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-blue-600)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {tab.label}
                    </p>
                    {completed ? (
                      <span className="rounded-full bg-[var(--color-status-green-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-status-green-text)]">
                        Done
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{tab.description}</p>
                </button>
              );
            })}
          </div>
        </header>

        {activeTab === "stores" ? (
          <>
            <StoresImporter onImported={refreshStores} />
            <ImportHistory title="Store import history" fetchUrl="/api/v1/stores/import/history" />
          </>
        ) : null}

        {activeTab === "products" ? (
          <>
            <ProductImporter />
            <ImportHistory title="Product import history" fetchUrl="/api/v1/products/import/history" />
          </>
        ) : null}

        {activeTab === "sales" ? (
          <section className="space-y-4">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Sales</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">Upload sales by store</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Sales data must be tied to a specific store. Pick a store, set the period, and upload.
              </p>

              {stores.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] px-3 py-2 text-sm text-[var(--color-status-yellow-text)]">
                  Upload at least one store first (in the Stores tab) before uploading sales.
                </p>
              ) : (
                <div className="mt-4 max-w-md">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Store
                  </label>
                  <select
                    value={salesStoreId}
                    onChange={(event) => setSalesStoreId(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue-600)]"
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
      </div>
    </main>
  );
}
