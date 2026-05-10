"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

interface FileUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  maxSizeMB?: number;
}

const DEFAULT_ACCEPT = ".csv,.txt,.xlsx,.xls,.pdf";
const DEFAULT_MAX_SIZE = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function detectFormat(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    return "CSV";
  }
  if (ext === "xls" || ext === "xlsx") {
    return "Excel";
  }
  if (ext === "pdf") {
    return "PDF";
  }
  return "Unknown";
}

export default function FileUploader({
  onUpload,
  isUploading,
  accept = DEFAULT_ACCEPT,
  label = "Upload a file",
  hint = "CSV, Excel, or PDF up to 10 MB",
  maxSizeMB = DEFAULT_MAX_SIZE,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const maxSize = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setError(fileRejections[0]?.errors[0]?.message ?? "File rejected.");
        setSelectedFile(null);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const allowed = accept.split(",").map((value) => value.replace(".", "").trim());
      if (!allowed.includes(extension)) {
        setError("Unsupported file type. Please upload CSV, Excel, or PDF.");
        setSelectedFile(null);
        return;
      }

      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${maxSizeMB} MB.`);
        setSelectedFile(null);
        return;
      }

      setError("");
      setSelectedFile(file);
    },
    [accept, maxSize, maxSizeMB],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    disabled: isUploading,
    multiple: false,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          Max {maxSizeMB} MB
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center text-sm text-gray-400 transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
        } ${isUploading ? "opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-gray-900">
          {isDragActive ? "Drop the file here" : "Drag and drop a file here"}
        </p>
        <p className="mt-2 text-xs text-gray-500">Or click to browse your computer</p>
      </div>

      {selectedFile ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {formatBytes(selectedFile.size)} / {detectFormat(selectedFile.name)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-md border border-blue-600 bg-white px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
              disabled={isUploading}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">Accepted: {accept}</p>
        <button
          type="button"
          onClick={() => selectedFile && onUpload(selectedFile)}
          disabled={!selectedFile || isUploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </section>
  );
}
