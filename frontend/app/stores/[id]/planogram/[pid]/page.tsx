"use client";

import axios from "axios";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ConfidenceBadge from "@/components/planogram/ConfidenceBadge";
import DataQualityBanner from "@/components/planogram/DataQualityBanner";
import ExportMenu from "@/components/planogram/ExportMenu";
import FacingControls from "@/components/planogram/FacingControls";
import ProductPanel from "@/components/planogram/ProductPanel";
import RegenerateButton from "@/components/planogram/RegenerateButton";
import VersionHistoryPanel from "@/components/layout/VersionHistoryPanel";
import { api } from "@/lib/api";
import { ensurePlanogramForStore, isUuid } from "@/lib/planogramRouting";
import { usePlanogramStore } from "@/store/planogramStore";
import type { Planogram } from "@/types/planogram";

const PlanogramCanvas = dynamic(() => import("@/components/planogram/PlanogramCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">
      Loading canvas...
    </div>
  ),
});

type ErrorAction = "create-store" | null;

export default function StorePlanogramPage() {
  const router = useRouter();
  const params = useParams();

  const storeId = String(params?.id ?? "");
  const planogramIdParam = String(params?.pid ?? "");

  const planogram = usePlanogramStore((state) => state.planogram);
  const isDirty = usePlanogramStore((state) => state.isDirty);
  const isSaving = usePlanogramStore((state) => state.isSaving);
  const setPlanogram = usePlanogramStore((state) => state.setPlanogram);
  const markSaving = usePlanogramStore((state) => state.markSaving);
  const markSaved = usePlanogramStore((state) => state.markSaved);
  const clearStore = usePlanogramStore((state) => state.clear);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [errorAction, setErrorAction] = useState<ErrorAction>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => () => clearStore(), [clearStore]);

  const handleRequestError = useCallback((err: unknown, fallbackMessage: string) => {
    setErrorDetail("");
    setErrorAction(null);

    if (!axios.isAxiosError(err)) {
      setError(fallbackMessage);
      return;
    }

    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    if (status === 404) {
      setError("Store or planogram not found for this account.");
      setErrorAction("create-store");
      return;
    }

    if (status === 422) {
      setError("This planogram link is invalid. Create a store first.");
      setErrorAction("create-store");
      return;
    }

    if (status === 403 && typeof detail === "object" && detail?.error === "quota_exceeded") {
      const message = detail?.detail?.message;
      setError(message || "Annual planogram limit reached for this account.");
      return;
    }

    const suffix = status ? ` (${status})` : "";
    setError(`${fallbackMessage}${suffix}`);
    if (detail) {
      setErrorDetail(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  }, []);

  const loadPlanogram = useCallback(async () => {
    setLoading(true);
    setError("");
    setErrorDetail("");
    setErrorAction(null);

    if (!isUuid(storeId)) {
      setError("This store link is invalid. Create a store first.");
      setErrorAction("create-store");
      setLoading(false);
      return;
    }

    try {
      if (planogramIdParam === "latest") {
        const latest = await ensurePlanogramForStore(storeId);
        setPlanogram(latest);
        setNameDraft(latest.name);
        router.replace(`/stores/${storeId}/planogram/${latest.id}`);
        return;
      }

      if (!isUuid(planogramIdParam)) {
        setError("This planogram link is invalid. Create a store first.");
        setErrorAction("create-store");
        return;
      }

      const response = await api.get<Planogram>(`/api/v1/planograms/${planogramIdParam}`);
      if (response.data.store_id !== storeId) {
        setError("This planogram does not belong to the selected store.");
        setErrorAction("create-store");
        return;
      }

      setPlanogram(response.data);
      setNameDraft(response.data.name);
    } catch (err) {
      handleRequestError(err, "Unable to load planogram.");
    } finally {
      setLoading(false);
    }
  }, [handleRequestError, planogramIdParam, router, setPlanogram, storeId]);

  useEffect(() => {
    void loadPlanogram();
  }, [loadPlanogram]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(""), 2000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleSave = useCallback(async () => {
    if (!planogram) return;
    markSaving(true);
    try {
      const response = await api.put<Planogram>(`/api/v1/planograms/${planogram.id}`, {
        name: nameDraft.trim() || planogram.name,
        planogram_json: planogram.planogram_json,
      });
      setPlanogram(response.data);
      setNameDraft(response.data.name);
      markSaved();
      setStatusMessage("Saved");
    } catch (err) {
      markSaving(false);
      handleRequestError(err, "Unable to save planogram.");
    }
  }, [handleRequestError, markSaved, markSaving, nameDraft, planogram, setPlanogram]);

  const handleNameBlur = async () => {
    if (!planogram) {
      setIsEditingName(false);
      return;
    }
    const trimmed = nameDraft.trim();
    setIsEditingName(false);
    if (!trimmed || trimmed === planogram.name) {
      setNameDraft(planogram.name);
      return;
    }
    try {
      const response = await api.put<Planogram>(`/api/v1/planograms/${planogram.id}`, {
        name: trimmed,
      });
      setPlanogram(response.data);
      setNameDraft(response.data.name);
      setStatusMessage("Saved");
    } catch (err) {
      handleRequestError(err, "Unable to save planogram name.");
    }
  };

  const handleRegenerated = (next: Planogram) => {
    setPlanogram(next);
    setNameDraft(next.name);
    setStatusMessage("Regenerated");
    router.replace(`/stores/${storeId}/planogram/${next.id}`);
  };

  const planogramJson = planogram?.planogram_json;
  const warnings = useMemo(() => planogramJson?.data_quality_warnings ?? [], [planogramJson]);
  const confidence = planogramJson?.confidence ?? null;
  const totalSkuCount = useMemo(
    () =>
      planogramJson?.shelves.reduce((sum, shelf) => sum + shelf.products.length, 0) ?? 0,
    [planogramJson],
  );

  const tier = (confidence?.tier ?? "").toLowerCase();
  const lowConfidenceBanner = tier === "low";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex w-full flex-col gap-4 py-6">
        <header className="h-12 border-b border-gray-200 bg-white px-4">
          <div className="flex h-full flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                {"← Dashboard"}
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  Planogram / {planogram?.generation_level ?? "store"}
                </p>
                {isEditingName ? (
                  <input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    onBlur={handleNameBlur}
                    autoFocus
                    className="mt-1 w-full max-w-xs rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="mt-1 text-left text-sm font-medium text-gray-900 transition-colors hover:text-blue-600"
                  >
                    {planogram?.name ?? "Planogram"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ConfidenceBadge confidence={confidence} />
              {planogram ? (
                <RegenerateButton
                  storeId={storeId}
                  generationLevel={planogram.generation_level}
                  shelfCount={planogram.shelf_count}
                  shelfWidthCm={planogram.shelf_width_cm}
                  shelfHeightCm={planogram.shelf_height_cm}
                  isUserEdited={planogram.is_user_edited}
                  isDirty={isDirty}
                  onGenerated={handleRegenerated}
                  onError={(message) => setError(message)}
                />
              ) : null}
              {statusMessage ? (
                <span className="text-sm font-medium text-blue-600">
                  {statusMessage}
                </span>
              ) : null}
              <button
                type="button"
                disabled={!isDirty || !planogram || isSaving}
                onClick={() => void handleSave()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <ExportMenu planogramId={planogram?.id ?? null} disabled={isDirty} />
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                disabled={!planogram}
                className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                History
              </button>
            </div>
          </div>
        </header>

        {lowConfidenceBanner ? (
          <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800">
            <strong>Draft only.</strong> This planogram has low data quality. Improve the inputs flagged
            below before relying on it.
          </div>
        ) : null}

        {warnings.length > 0 ? <DataQualityBanner warnings={warnings} /> : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            {errorDetail ? (
              <p className="mt-1 text-xs text-red-800">{errorDetail}</p>
            ) : null}
            {errorAction === "create-store" ? (
              <button
                type="button"
                onClick={() => router.push("/stores/new/planogram")}
                className="mt-3 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Create store
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[260px_1fr_260px]">
          <aside className="flex flex-col gap-4">
            <ProductPanel />
          </aside>

          <section className="flex h-[640px] min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {loading || !planogram ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading planogram...
              </div>
            ) : (
              <div className="flex-1 min-w-0 overflow-hidden">
                <PlanogramCanvas />
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <FacingControls />

            <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Summary
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  Shelves:{" "}
                  <span className="font-medium text-gray-900">
                    {planogramJson?.shelf_config.shelf_count ?? 0}
                  </span>
                </li>
                <li>
                  SKUs placed:{" "}
                  <span className="font-medium text-gray-900">{totalSkuCount}</span>
                </li>
                <li>
                  Method:{" "}
                  <span className="font-medium text-gray-900">
                    {planogram?.generation_method ?? "-"}
                  </span>
                </li>
                <li>
                  Store type:{" "}
                  <span className="font-medium text-gray-900">
                    {planogramJson?.shelf_config.store_type ?? "unknown"}
                  </span>
                </li>
                {planogramJson?.assortment ? (
                  <li className="pt-1 text-xs text-gray-500">
                    {planogramJson.assortment.message}
                  </li>
                ) : null}
              </ul>

              <button
                type="button"
                onClick={() => router.push(`/stores/${storeId}/data`)}
                className="mt-3 w-full rounded-md border border-blue-600 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                Manage Sales Data
              </button>
            </div>
          </aside>
        </div>
      </div>

      <VersionHistoryPanel
        planogramId={planogram?.id ?? null}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestored={(next) => {
          setPlanogram(next);
          setNameDraft(next.name);
          setStatusMessage("Restored");
        }}
      />
    </main>
  );
}
