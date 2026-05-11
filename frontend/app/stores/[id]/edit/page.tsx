"use client";

import { useParams, useRouter } from "next/navigation";

export default function StoreEditPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = String(params?.id ?? "");

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Store edit flow is next</h1>
        <p className="mt-1 text-sm text-gray-500">
          Store metadata editing will be added in the next slice. You can continue by updating sales and imports for
          this store.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/stores/${storeId}/data`)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Open Store Data
          </button>
          <button
            type="button"
            onClick={() => router.push(`/stores/${storeId}/planogram/latest`)}
            className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Back to Planogram
          </button>
        </div>
      </div>
    </main>
  );
}
