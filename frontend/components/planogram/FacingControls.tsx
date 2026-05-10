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
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-xs text-[var(--color-text-secondary)]">
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

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Selected SKU</p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{product.sku}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">{product.name}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Facings</p>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateFacings(product.sku, shelf.shelf_number, product.facing_count - 1)}
            disabled={product.facing_count <= 1}
            className="h-8 w-8 rounded-full border border-[var(--color-border)] text-base font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-blue-600)] disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[3ch] text-center text-lg font-semibold text-[var(--color-text-primary)]">
            {product.facing_count}
          </span>
          <button
            type="button"
            onClick={() => updateFacings(product.sku, shelf.shelf_number, product.facing_count + 1)}
            disabled={!canIncrement}
            className="h-8 w-8 rounded-full border border-[var(--color-border)] text-base font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-blue-600)] disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>Shelf {shelf.shelf_number} occupancy</span>
          <span className="font-mono">{occupancyPct.toFixed(0)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
          <div
            className={`h-full ${
              occupancyPct >= 95
                ? "bg-[var(--color-status-red-text)]"
                : occupancyPct >= 80
                  ? "bg-[var(--color-status-yellow-text)]"
                  : "bg-[var(--color-status-green-text)]"
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeProduct(product.sku, shelf.shelf_number)}
        className="w-full rounded-full border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-status-red-text)] transition hover:opacity-90"
      >
        Remove from shelf
      </button>
    </div>
  );
}
