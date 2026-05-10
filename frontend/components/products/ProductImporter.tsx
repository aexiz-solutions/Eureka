"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import FileUploader from "@/components/ingestion/FileUploader";
import ImportSummaryCard from "@/components/ingestion/ImportSummaryCard";
import type { ImportSummaryResponse } from "@/components/ingestion/types";

interface ProductImporterProps {
  onImported?: () => void;
}

const SAMPLE_CSV = `sku,name,brand,category,width_cm,height_cm,depth_cm,price
SKU-001,Organic Milk 1L,DairyBest,Dairy,7.5,23,7.5,2.99
SKU-002,Wheat Bread 400g,BreadCo,Bakery,10,12,23,1.49
SKU-003,Orange Juice 500ml,FreshSqueeze,Beverages,6,18,6,3.50
`;

export default function ProductImporter({ onImported }: ProductImporterProps) {
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ImportSummaryResponse>("/api/v1/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSummary(response.data);
      if (onImported) {
        onImported();
      }
    } catch {
      setError("Unable to import products. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <FileUploader
        onUpload={handleUpload}
        isUploading={isUploading}
        label="Import product master data"
        hint="CSV, Excel, or PDF with SKU and name columns."
      />

      <details className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium text-gray-900">
          Format guide
        </summary>
        <div className="mt-3 text-sm text-gray-500">
          <p>Required columns: sku, name</p>
          <p className="mt-2">
            Optional columns: brand, category, width_cm, height_cm, depth_cm, price
          </p>
          <button
            type="button"
            onClick={downloadSample}
            className="mt-4 rounded-md border border-blue-600 bg-white px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Download sample CSV
          </button>
        </div>
      </details>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {summary ? (
        <ImportSummaryCard
          summary={summary}
          onDismiss={() => setSummary(null)}
          onViewErrors={() => undefined}
        />
      ) : null}
    </div>
  );
}
