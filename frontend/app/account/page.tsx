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
      <main className="flex min-h-screen items-center justify-center bg-gray-50 py-6">
        <section className="w-full rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            You need to sign in to view your account details.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  const planInfo = PLAN_DETAILS[user.subscription_tier as PlanTier];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex w-full flex-col gap-6 py-8">
      <header className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Plan: {planLabel}</h1>
        <p className="mt-1 text-sm text-gray-500">{planInfo.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Plan highlights</h2>
          <p className="mt-1 text-sm text-gray-500">{planInfo.title}</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500">
            {planInfo.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gray-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Your details</h2>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>
              <span className="font-medium text-gray-900">Name:</span> {user.first_name} {user.last_name}
            </p>
            <p>
              <span className="font-medium text-gray-900">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium text-gray-900">Username:</span> {user.username}
            </p>
            <p>
              <span className="font-medium text-gray-900">Company:</span> {user.company_name || "-"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Role:</span> {ROLE_LABELS[user.role] ?? user.role}
            </p>
            <p>
              <span className="font-medium text-gray-900">Status:</span> {user.approval_status}
            </p>
            <p>
              <span className="font-medium text-gray-900">Member since:</span> {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
