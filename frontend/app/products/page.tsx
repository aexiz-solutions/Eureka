"use client";

import ImportHistory from "@/components/ingestion/ImportHistory";
import ProductImporter from "@/components/products/ProductImporter";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">Product master data</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload product master data to keep SKU dimensions, pricing, and categories up to date.
          </p>
        </header>

        <ProductImporter />

        <ImportHistory title="Product import history" fetchUrl="/api/v1/products/import/history" />
      </div>
    </main>
  );
}
