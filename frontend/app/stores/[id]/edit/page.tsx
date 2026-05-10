"use client";

import { useParams, useRouter } from "next/navigation";

export default function StoreEditPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = String(params?.id ?? "");

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)] px-6 py-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Store details</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Store edit flow is next</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Store metadata editing will be added in the next slice. You can continue by updating sales and imports for
          this store.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/stores/${storeId}/data`)}
            className="rounded-full bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-blue-700)]"
          >
            Open Store Data
          </button>
          <button
            type="button"
            onClick={() => router.push(`/stores/${storeId}/planogram/latest`)}
            className="rounded-full border border-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
          >
            Back to Planogram
          </button>
        </div>
      </div>
    </main>
  );
}
