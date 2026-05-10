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
        className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
      >
        {working ? "Regenerating..." : "Regenerate"}
      </button>

      {confirming ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-yellow-200 bg-yellow-100 p-4 shadow-md">
          <p className="text-sm font-medium text-yellow-800">Overwrite your edits?</p>
          <p className="mt-1 text-xs text-yellow-800">
            This planogram has manual edits. Regenerating will replace the layout with a fresh
            auto-generated version. Your unsaved changes will be lost.
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md bg-transparent px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void runGeneration(true)}
              disabled={working}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {working ? "Regenerating..." : "Overwrite"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
