"use client";

import { useState } from "react";

import FileUploader from "@/components/ingestion/FileUploader";
import ImportSummaryCard from "@/components/ingestion/ImportSummaryCard";
import type { ImportSummaryResponse } from "@/components/ingestion/types";
import { api } from "@/lib/api";

interface StoresImporterProps {
  onImported?: () => void;
}

const SAMPLE_CSV = `store_name,city,state,store_type
Reliance Fresh Indiranagar BLR,Bangalore,Karnataka,supermarket
DMart Hadapsar Pune,Pune,Maharashtra,hypermarket
HV Whitefield BLR,Bangalore,Karnataka,supermarket
`;

export default function StoresImporter({ onImported }: StoresImporterProps) {
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<ImportSummaryResponse>("/api/v1/stores/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSummary(response.data);
      if (onImported) onImported();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "response" in err
          ? // @ts-expect-error narrow axios error
            err.response?.data?.detail ?? "Failed to import stores."
          : "Failed to import stores.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stores_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-base font-semibold text-gray-900">Upload your store list</h2>
        <p className="mt-1 text-sm text-gray-500">
          Eureka parses store names to build the country, state, and city hierarchy automatically. Required
          column: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">store_name</code>.
          Optional: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">city</code>,{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">state</code>,{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">store_type</code>.
        </p>
        <button
          type="button"
          onClick={downloadSample}
          className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Download sample CSV
        </button>
      </header>

      <div className="mt-4">
        <FileUploader
          onUpload={(file) => void handleUpload(file)}
          isUploading={isUploading}
          label="Upload stores CSV / Excel"
          hint="CSV, XLSX, or XLS up to 10 MB"
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="mt-4">
          <ImportSummaryCard summary={summary} onDismiss={() => setSummary(null)} />
        </div>
      ) : null}
    </section>
  );
}
