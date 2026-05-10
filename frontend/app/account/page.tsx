"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/authStore";

type PlanTier = "admin" | "individual-plus" | "individual-pro" | "enterprise";

type PlanInfo = {
  title: string;
  summary: string;
  highlights: string[];
};

const PLAN_LABELS: Record<PlanTier, string> = {
  admin: "Admin",
  "individual-plus": "Individual Plus",
  "individual-pro": "Individual Pro",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  merchandiser: "Individual Plus",
  "merchandiser-pro": "Individual Pro",
  enterprise: "Enterprise",
};

const PLAN_DETAILS: Record<PlanTier, PlanInfo> = {
  admin: {
    title: "Admin Access",
    summary: "Full control of onboarding, users, and plan limits.",
    highlights: ["Manage approvals", "Configure plan limits", "Access all tenant data"],
  },
  "individual-plus": {
    title: "Individual Plus",
    summary: "Great for single stores getting started with layout and reporting.",
    highlights: ["Core layout builder", "Basic analytics", "Email support"],
  },
  "individual-pro": {
    title: "Individual Pro",
    summary: "Expanded capacity for growing retail teams and deeper reporting.",
    highlights: ["Advanced layout tools", "Priority analytics", "Faster approvals"],
  },
  enterprise: {
    title: "Enterprise",
    summary: "Tailored onboarding and higher scale for multi-site operations.",
    highlights: ["Custom onboarding", "Multi-store support", "Dedicated success"],
  },
};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString();
}

export default function AccountPage() {
  const router = useRouter();
  const { initializeAuth, user, logout } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
    setInitialized(true);
  }, [initializeAuth]);

  const planLabel = useMemo(() => {
    if (!user) {
      return "Unknown";
    }
    return PLAN_LABELS[user.subscription_tier as PlanTier] ?? "Unknown";
  }, [user]);

  if (!initialized) {
    return null;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] p-6">
        <section className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You need to sign in to view your account details.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-blue-700)]"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  const planInfo = PLAN_DETAILS[user.subscription_tier as PlanTier];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-8">
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-[var(--color-text-secondary)]">Account</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Plan: {planLabel}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{planInfo.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-[var(--color-blue-600)] transition hover:bg-[var(--color-blue-100)]"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--color-blue-600)] transition hover:text-[var(--color-blue-700)]"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Plan highlights</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{planInfo.title}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            {planInfo.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-text-secondary)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Your details</h2>
          <div className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Name:</span> {user.first_name} {user.last_name}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Username:</span> {user.username}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Company:</span> {user.company_name || "-"}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Role:</span> {ROLE_LABELS[user.role] ?? user.role}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Status:</span> {user.approval_status}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Member since:</span> {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
