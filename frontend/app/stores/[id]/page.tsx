"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { isUuid, listPlanogramsForStore } from "@/lib/planogramRouting";
import type { Planogram } from "@/types/planogram";

interface Store {
  id: string;
  raw_name: string;
  display_name: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  locality: string | null;
  store_type: string | null;
  detected_chain: string | null;
  parse_confidence: number | null;
}

interface ProductListResponse {
  data: { id: string }[];
  total: number;
}

interface SalesListResponse {
  data: unknown[];
  total: number;
}

function ReadinessBadge({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ready ? "bg-green-100 text-green-700" : "bg-red-100 text-red-800"
      }`}
    >
      {label}: {ready ? "Ready" : "Missing"}
    </span>
  );
}

export default function StoreLandingPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = String(params?.id ?? "");

  const [store, setStore] = useState<Store | null>(null);
  const [planograms, setPlanograms] = useState<Planogram[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  const loadAll = useCallback(async () => {
    if (!isUuid(storeId)) {
      setError("This store link is invalid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setErrorDetail("");
    try {
      const [storeRes, productRes, salesRes, planogramList] = await Promise.all([
        api.get<Store>(`/api/v1/stores/${storeId}`),
        api.get<ProductListResponse>("/api/v1/products"),
        api.get<SalesListResponse>(`/api/v1/sales?store_id=${storeId}`),
        listPlanogramsForStore(storeId).catch(() => [] as Planogram[]),
      ]);
      setStore(storeRes.data);
      setProductCount(productRes.data.total ?? productRes.data.data?.length ?? 0);
      setSalesCount(salesRes.data.total ?? salesRes.data.data?.length ?? 0);
      setPlanograms(planogramList);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Store not found for this account.");
      } else {
        setError("Unable to load store details.");
      }
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setErrorDetail("");
    try {
      const response = await api.post<Planogram>("/api/v1/planograms/generate", {
        store_id: storeId,
        generation_level: "store",
        force: planograms.length > 0,
      });
      router.push(`/stores/${storeId}/planogram/${response.data.id}`);
    } catch (err: unknown) {
      setGenerating(false);
      if (!axios.isAxiosError(err)) {
        setError("Unable to generate planogram.");
        return;
      }
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 403 && typeof detail === "object" && detail?.error === "quota_exceeded") {
        const message = detail?.detail?.message ?? "Annual planogram limit reached for this account.";
        setError(message);
        return;
      }
      const fallback = `Unable to generate planogram${status ? ` (${status})` : ""}.`;
      setError(fallback);
      if (detail) {
        setErrorDetail(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
    }
  };

  const canGenerate = useMemo(
    () => Boolean(store) && (productCount ?? 0) > 0,
    [productCount, store],
  );

  const latestPlanogram = planograms[0] ?? null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex w-full flex-col gap-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push(`/stores/${storeId}/data`)}
            className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Manage Data
          </button>
        </header>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
            Loading store...
          </div>
        ) : !store ? (
          <div className="rounded-lg border border-red-200 bg-red-100 p-6 text-sm text-red-800">
            {error || "Store not available."}
          </div>
        ) : (
          <>
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl font-semibold text-gray-900">
                {store.display_name ?? store.raw_name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {[store.locality, store.city, store.state, store.country]
                  .filter(Boolean)
                  .join(", ") || "Location not parsed yet"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {store.store_type ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {store.store_type}
                  </span>
                ) : null}
                {store.detected_chain ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {store.detected_chain}
                  </span>
                ) : null}
                {store.parse_confidence !== null && store.parse_confidence !== undefined ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Parse confidence: {Math.round((store.parse_confidence || 0) * 100)}%
                  </span>
                ) : null}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">AI Planogram</h2>
                  <p className="mt-1 max-w-xl text-sm text-gray-500">
                    Generate a planogram from products, sales, and store metadata. You can edit the result
                    on the canvas and export it later.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ReadinessBadge label="Products" ready={(productCount ?? 0) > 0} />
                    <ReadinessBadge label="Sales data" ready={(salesCount ?? 0) > 0} />
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Planograms: {planograms.length}
                    </span>
                  </div>

                  {productCount !== null && productCount === 0 ? (
                    <p className="mt-4 rounded-md border border-yellow-200 bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
                      Upload at least one product before generating a planogram.{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/upload")}
                        className="font-medium underline"
                      >
                        Upload products
                      </button>
                    </p>
                  ) : null}

                  {error ? (
                    <div className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
                      <p>{error}</p>
                      {errorDetail ? <p className="mt-1 text-xs text-red-800">{errorDetail}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col items-stretch gap-2 lg:items-end">
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={!canGenerate || generating}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating
                      ? "Generating..."
                      : planograms.length > 0
                        ? "Regenerate AI Planogram"
                        : "Generate AI Planogram"}
                  </button>
                  {latestPlanogram ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/stores/${storeId}/planogram/${latestPlanogram.id}`)
                      }
                      className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Open latest planogram
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            {planograms.length > 0 ? (
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900">Planograms</h3>
                  <span className="text-sm text-gray-500">{planograms.length} requests</span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Edited
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Updated
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {planograms.map((planogram) => (
                        <tr key={planogram.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{planogram.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{planogram.generation_method}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {planogram.is_user_edited ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500">
                            {new Date(planogram.updated_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/stores/${storeId}/planogram/${planogram.id}`)
                              }
                              className="rounded-md border border-blue-600 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
