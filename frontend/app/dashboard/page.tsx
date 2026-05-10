"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import DataHealthWidget from "@/components/dashboard/DataHealthWidget";
import HierarchyTree, { type HierarchyStore } from "@/components/dashboard/HierarchyTree";
import NewStoreModal from "@/components/stores/NewStoreModal";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const PLAN_LABELS = {
  admin: "Admin",
  "individual-plus": "Individual Plus",
  "individual-pro": "Individual Pro",
  enterprise: "Enterprise",
} as const;

interface StoreListResponse {
  data: HierarchyStore[];
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { initializeAuth, user, logout } = useAuthStore();
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isPreparingPlanogram, setIsPreparingPlanogram] = useState(false);
  const [stores, setStores] = useState<HierarchyStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/super-admin");
    }
  }, [router, user?.role]);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    setError("");
    try {
      const response = await api.get<StoreListResponse>("/api/v1/stores");
      const data = response.data.data ?? [];
      setStores(data);
      if (!selectedStoreId && data.length > 0) {
        setSelectedStoreId(data[0].id);
      }
    } catch (err) {
      setStores([]);
      setError("Unable to load stores.");
    } finally {
      setStoresLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      void loadStores();
    }
  }, [loadStores, user]);

  const handleStoreCreated = async (storeId: string) => {
    setIsPreparingPlanogram(true);
    try {
      router.push(`/stores/${storeId}`);
    } finally {
      setIsPreparingPlanogram(false);
    }
  };

  const planLabel = user ? PLAN_LABELS[user.subscription_tier] : "Unknown";

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  );

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome, {user?.first_name ?? user?.username ?? "there"} / Plan: {planLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/upload")}
                className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                Upload Data
              </button>
              <button
                type="button"
                onClick={() => setIsCreateStoreOpen(true)}
                disabled={isPreparingPlanogram}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + New Store
              </button>
              <button
                type="button"
                onClick={() => router.push("/account")}
                className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </header>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Store hierarchy</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Country, state, city, and locality. Click a store to open its planogram workspace.
                </p>
              </div>
              <span className="text-sm text-gray-500">
                {storesLoading
                  ? "Loading..."
                  : `${stores.length} ${stores.length === 1 ? "store" : "stores"}`}
              </span>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(280px,1fr)]">
              <div className="max-h-[480px] overflow-y-auto">
                <HierarchyTree
                  stores={stores}
                  selectedStoreId={selectedStoreId}
                  onSelectStore={(storeId) => setSelectedStoreId(storeId)}
                />
              </div>

              <div className="space-y-3">
                {selectedStore ? (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Selected store
                          </p>
                          <p className="mt-1 truncate text-base font-semibold text-gray-900">
                            {selectedStore.display_name ?? selectedStore.raw_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {[
                              selectedStore.locality,
                              selectedStore.city,
                              selectedStore.state,
                              selectedStore.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Location unknown"}
                          </p>
                          {selectedStore.store_type ? (
                            <p className="mt-1 text-xs text-gray-500">Type: {selectedStore.store_type}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/stores/${selectedStore.id}`)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Open store
                        </button>
                      </div>
                    </div>

                    <DataHealthWidget
                      storeId={selectedStore.id}
                      storeName={selectedStore.display_name ?? selectedStore.raw_name}
                    />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Click a store in the hierarchy to see details and data health.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <NewStoreModal
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onCreated={(store) => void handleStoreCreated(store.id)}
      />
    </>
  );
}
