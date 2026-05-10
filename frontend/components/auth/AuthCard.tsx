"use client";

import { FormEvent, ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  footer: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  subtitle,
  ctaLabel,
  footer,
  onSubmit,
  loading,
  error,
  children,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <p className="text-xl font-semibold text-gray-900">Eureka</p>
      <h1 className="mt-6 text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {children}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Please wait..." : ctaLabel}
        </button>
      </form>

      <div className="mt-5 text-sm text-gray-500">{footer}</div>
    </div>
  );
}
