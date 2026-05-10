"use client";

import { useMemo } from "react";

import { usePlanogramStore } from "@/store/planogramStore";

export default function FacingControls() {
  const planogram = usePlanogramStore((state) => state.planogram);
  const selectedSku = usePlanogramStore((state) => state.selectedProductSku);
  const updateFacings = usePlanogramStore((state) => state.updateFacings);
  const removeProduct = usePlanogramStore((state) => state.removeProduct);

  const found = useMemo(() => {
    if (!planogram || !selectedSku) return null;
    for (const shelf of planogram.planogram_json.shelves) {
      const product = shelf.products.find((p) => p.sku === selectedSku);
      if (product) {
        return { shelf, product };
      }
    }
    return null;
  }, [planogram, selectedSku]);

  if (!planogram) return null;

  if (!found) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-xs text-gray-500">
        Click a product on the canvas to edit facings.
      </div>
    );
  }

  const { shelf, product } = found;
  const shelfWidthCm = planogram.planogram_json.shelf_config.shelf_width_cm;
  const used = shelf.products.reduce((sum, p) => sum + p.width_cm * p.facing_count, 0);
  const occupancyPct = Math.min(100, (used / shelfWidthCm) * 100);

  const canIncrement =
    used - product.width_cm * product.facing_count + product.width_cm * (product.facing_count + 1) <=
    shelfWidthCm;

  const occupancyClass =
    occupancyPct >= 95
      ? "health-progress-red"
      : occupancyPct >= 80
        ? "health-progress-yellow"
        : "health-progress-blue";

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Selected SKU</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{product.sku}</p>
        <p className="text-xs text-gray-500">{product.name}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Facings</p>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateFacings(product.sku, shelf.shelf_number, product.facing_count - 1)}
            disabled={product.facing_count <= 1}
            className="h-8 w-8 rounded-md border border-gray-200 text-base font-medium text-gray-900 transition-colors hover:border-blue-600 disabled:opacity-40"
          >
            -
          </button>
          <span className="min-w-[3ch] text-center text-lg font-semibold text-gray-900">
            {product.facing_count}
          </span>
          <button
            type="button"
            onClick={() => updateFacings(product.sku, shelf.shelf_number, product.facing_count + 1)}
            disabled={!canIncrement}
            className="h-8 w-8 rounded-md border border-gray-200 text-base font-medium text-gray-900 transition-colors hover:border-blue-600 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Shelf {shelf.shelf_number} occupancy</span>
          <span className="font-mono">{occupancyPct.toFixed(0)}%</span>
        </div>
        <progress className={`health-progress mt-1 ${occupancyClass}`} value={occupancyPct} max={100}>
          {occupancyPct.toFixed(0)}%
        </progress>
      </div>

      <button
        type="button"
        onClick={() => removeProduct(product.sku, shelf.shelf_number)}
        className="w-full rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-100"
      >
        Remove from shelf
      </button>
    </div>
  );
}
