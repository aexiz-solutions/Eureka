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
    <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {children}

        {error ? (
          <p className="rounded border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-blue-600)] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[var(--color-blue-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue-100)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait..." : ctaLabel}
        </button>
      </form>

      <div className="mt-5 text-sm text-[var(--color-text-secondary)]">{footer}</div>
    </div>
  );
}
