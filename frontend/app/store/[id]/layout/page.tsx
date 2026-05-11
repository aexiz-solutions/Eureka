"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { isUuid } from "@/lib/planogramRouting";

export default function StoreLayoutLegacyRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = String(params?.id ?? "");

  useEffect(() => {
    if (!isUuid(storeId)) {
      router.replace("/stores/new/planogram");
      return;
    }

    router.replace(`/stores/${storeId}/planogram/latest`);
  }, [router, storeId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] py-8">
      <p className="text-sm text-[var(--color-text-secondary)]">Redirecting to the planogram editor...</p>
    </main>
  );
}
