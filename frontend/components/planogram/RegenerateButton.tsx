"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import type { Planogram } from "@/types/planogram";

interface RegenerateButtonProps {
  storeId: string;
  generationLevel: string;
  shelfCount: number;
  shelfWidthCm: number;
  shelfHeightCm: number;
  isUserEdited: boolean;
  isDirty: boolean;
  onGenerated: (planogram: Planogram) => void;
  onError: (message: string) => void;
}

export default function RegenerateButton({
  storeId,
  generationLevel,
  shelfCount,
  shelfWidthCm,
  shelfHeightCm,
  isUserEdited,
  isDirty,
  onGenerated,
  onError,
}: RegenerateButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  const requiresWarning = isUserEdited || isDirty;

  const handleClick = () => {
    if (requiresWarning) {
      setConfirming(true);
      return;
    }
    void runGeneration(false);
  };

  const runGeneration = async (force: boolean) => {
    setWorking(true);
    try {
      const response = await api.post<Planogram>("/api/v1/planograms/generate", {
        store_id: storeId,
        generation_level: generationLevel,
        shelf_count: shelfCount,
        shelf_width_cm: shelfWidthCm,
        shelf_height_cm: shelfHeightCm,
        force,
      });
      onGenerated(response.data);
      setConfirming(false);
    } catch (err) {
      onError("Unable to regenerate planogram.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={working}
        className="rounded-full border border-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)] disabled:opacity-40"
      >
        {working ? "Regenerating..." : "Regenerate"}
      </button>

      {confirming ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] p-4 shadow-lg">
          <p className="text-sm font-semibold text-[var(--color-status-yellow-text)]">
            Overwrite your edits?
          </p>
          <p className="mt-1 text-xs text-[var(--color-status-yellow-text)]">
            This planogram has manual edits. Regenerating will replace the layout with a fresh
            auto-generated version. Your unsaved changes will be lost.
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--color-status-yellow-text)] hover:opacity-80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void runGeneration(true)}
              disabled={working}
              className="rounded-full bg-[var(--color-status-yellow-text)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {working ? "Regenerating..." : "Yes, overwrite"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
