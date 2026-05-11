"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import NewStoreModal, { type StoreRecord } from "@/components/stores/NewStoreModal";
import { openPlanogramForStore } from "@/lib/planogramRouting";

export default function NewPlanogramPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    router.replace("/dashboard");
  };

  const handleCreated = async (store: StoreRecord) => {
    setCreating(true);
    try {
      const targetPath = await openPlanogramForStore(store.id);
      router.replace(targetPath);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="flex w-full flex-col gap-6">
        <header className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Create a store first</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planograms belong to a store. Create one now and we will generate and open the first planogram.
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={creating}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Preparing planogram..." : "Create store"}
          </button>
        </header>
      </div>

      <NewStoreModal isOpen={isOpen} onClose={handleClose} onCreated={(store) => void handleCreated(store)} />
    </main>
  );
}
