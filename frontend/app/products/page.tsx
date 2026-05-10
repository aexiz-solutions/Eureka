"use client";

import ImportHistory from "@/components/ingestion/ImportHistory";
import ProductImporter from "@/components/products/ProductImporter";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)] px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Products</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Product master data</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Upload product master data to keep SKU dimensions, pricing, and categories up to date.
          </p>
        </header>

        <ProductImporter />

        <ImportHistory title="Product import history" fetchUrl="/api/v1/products/import/history" />
      </div>
    </main>
  );
}
