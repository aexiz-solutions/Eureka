"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { usePlanogramStore, type CatalogueProduct } from "@/store/planogramStore";

interface ProductListResponse {
  data: CatalogueProduct[];
  total: number;
}

export default function ProductPanel() {
  const planogram = usePlanogramStore((state) => state.planogram);
  const addProduct = usePlanogramStore((state) => state.addProduct);
  const setSelected = usePlanogramStore((state) => state.setSelected);

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [targetShelf, setTargetShelf] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<ProductListResponse>("/api/v1/products");
        if (!cancelled) {
          setProducts(response.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load product catalogue.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!planogram) return;
    if (targetShelf === null && planogram.planogram_json.shelves.length > 0) {
      const sorted = [...planogram.planogram_json.shelves].sort(
        (a, b) => a.shelf_number - b.shelf_number,
      );
      const eyeLevel = sorted.find((s) => s.tier === "eye_level");
      setTargetShelf((eyeLevel ?? sorted[0]).shelf_number);
    }
  }, [planogram, targetShelf]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(""), 1500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const placedSkus = useMemo(() => {
    const set = new Set<string>();
    if (!planogram) return set;
    for (const shelf of planogram.planogram_json.shelves) {
      for (const product of shelf.products) {
        set.add(product.sku);
      }
    }
    return set;
  }, [planogram]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category) set.add(product.category);
    }
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.sku.toLowerCase().includes(term) ||
        product.name.toLowerCase().includes(term) ||
        (product.brand?.toLowerCase().includes(term) ?? false);
      const matchesCategory =
        categoryFilter === "all" ||
        (product.category ?? "").toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const handleAdd = (product: CatalogueProduct) => {
    if (targetShelf === null) return;
    if (placedSkus.has(product.sku)) {
      setStatusMessage("Already on canvas");
      return;
    }
    addProduct(product, targetShelf);
    setSelected(product.sku);
    setStatusMessage("Added");
  };

  const shelves = planogram
    ? [...planogram.planogram_json.shelves].sort((a, b) => a.shelf_number - b.shelf_number)
    : [];

  return (
    <div className="flex h-full flex-col gap-3 border-r border-gray-200 bg-gray-50 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Catalogue</p>
        <p className="text-sm font-medium text-gray-900">{products.length} products</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search SKU, name, brand"
        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 6).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-600 hover:bg-white"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {shelves.length > 0 ? (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Add to shelf
          </label>
          <select
            value={targetShelf ?? ""}
            onChange={(event) => setTargetShelf(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {shelves.map((shelf) => (
              <option key={shelf.shelf_number} value={shelf.shelf_number}>
                Shelf {shelf.shelf_number} - {shelf.tier.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-3 text-xs text-red-800">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-gray-500">
            No products match your search.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((product) => {
              const isPlaced = placedSkus.has(product.sku);
              return (
                <li key={product.id} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{product.sku}</p>
                    <p className="truncate text-xs text-gray-500">{product.name}</p>
                  </div>
                  {isPlaced ? <span className="text-green-600">Placed</span> : null}
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    disabled={isPlaced || targetShelf === null}
                    className="rounded-md border border-blue-600 bg-white px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPlaced ? "On canvas" : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {statusMessage ? <p className="text-xs font-medium text-blue-600">{statusMessage}</p> : null}
    </div>
  );
}
