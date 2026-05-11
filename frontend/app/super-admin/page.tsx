"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type SuperAdminTab = "onboarding" | "users" | "limits";
type RequestFilter = "pending" | "approved" | "rejected" | "all";
type PlanTier = "admin" | "individual-plus" | "individual-pro" | "enterprise";

type UserPlanLimit = {
  annual_planogram_limit: number | null;
  is_unlimited: boolean;
  source: "tier" | "override";
};

type UserPlanLimitResponse = {
  data: {
    user_id: string;
    plan_limit: UserPlanLimit;
  };
  message: string;
};

type SuperAdminUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  company_name: string | null;
  phone_number: string | null;
  role: "admin" | "merchandiser" | "merchandiser-pro" | "enterprise";
  subscription_tier: PlanTier;
  approval_status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  planogram_count: number;
  plan_limit: UserPlanLimit;
};

type AdminStats = {
  users: { total: number; approved: number; pending: number };
  stores: { total: number };
  planograms: {
    total: number;
    total_quota: number;
    has_unlimited_users: boolean;
    utilisation_pct: number | null;
  };
};

type AdminStatsResponse = {
  data: AdminStats | unknown;
  message: string;
};

type SuperAdminUsersResponse = {
  data: SuperAdminUserRow[];
  message: string;
};

const FILTERS: Array<{ key: RequestFilter; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const TABS: Array<{ key: SuperAdminTab; label: string }> = [
  { key: "onboarding", label: "Pilot Onboarding" },
  { key: "users", label: "Users Table" },
  { key: "limits", label: "Limits" },
];

const PLAN_LABELS: Record<PlanTier, string> = {
  admin: "Admin",
  "individual-plus": "Individual Plus",
  "individual-pro": "Individual Pro",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<SuperAdminUserRow["role"], string> = {
  admin: "Admin",
  merchandiser: "Individual Plus",
  "merchandiser-pro": "Individual Pro",
  enterprise: "Enterprise",
};

const STATUS_STYLES: Record<SuperAdminUserRow["approval_status"], string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

const FILTER_ACTIVE_STYLES: Record<RequestFilter, string> = {
  pending: "bg-gray-900 text-white",
  approved: "bg-gray-900 text-white",
  rejected: "bg-gray-900 text-white",
  all: "bg-gray-900 text-white",
};

const FILTER_INACTIVE_STYLE =
  "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-800";

function isAdminStats(value: unknown): value is AdminStats {
  return Boolean(
    value &&
      typeof value === "object" &&
      "users" in value &&
      "stores" in value &&
      "planograms" in value,
  );
}

function getPlanogramCount(row: SuperAdminUserRow): number {
  return row.planogram_count ?? (row as SuperAdminUserRow & { layout_count?: number }).layout_count ?? 0;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { initializeAuth, user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SuperAdminTab>("onboarding");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("pending");

  const [onboardingRows, setOnboardingRows] = useState<SuperAdminUserRow[]>([]);
  const [usersRows, setUsersRows] = useState<SuperAdminUserRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [editingLimitUser, setEditingLimitUser] = useState<SuperAdminUserRow | null>(null);
  const [limitDraft, setLimitDraft] = useState({
    annualLimit: "",
    isUnlimited: false,
    useTierDefault: false,
  });
  const [savingUserLimit, setSavingUserLimit] = useState(false);
  const [userLimitError, setUserLimitError] = useState("");
  const [userLimitMessage, setUserLimitMessage] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const fetchRows = async () => {
      setLoadingRows(true);
      setRowsError("");
      try {
        const [onboardingResponse, usersResponse, statsResponse] = await Promise.all([
          api.get<SuperAdminUsersResponse>(`/api/v1/admin/onboarding/requests?status=${requestFilter}`),
          api.get<SuperAdminUsersResponse>("/api/v1/admin/users"),
          api.get<AdminStatsResponse>("/api/v1/admin/stats"),
        ]);
        setOnboardingRows(onboardingResponse.data.data);
        setUsersRows(usersResponse.data.data.filter((row) => row.role !== "admin"));
        setAdminStats(isAdminStats(statsResponse.data.data) ? statsResponse.data.data : null);
      } catch {
        setRowsError("Unable to fetch super admin data.");
      } finally {
        setLoadingRows(false);
      }
    };

    void fetchRows();
  }, [router, requestFilter, user?.id, user?.role]);

  const requestsCountLabel = useMemo(() => `${onboardingRows.length} requests`, [onboardingRows.length]);

  const formatLimit = (planLimit: UserPlanLimit): string => {
    if (planLimit.is_unlimited) {
      return "Unlimited";
    }
    return planLimit.annual_planogram_limit ? `${planLimit.annual_planogram_limit} / year` : "Not set";
  };

  const openLimitEditor = (row: SuperAdminUserRow) => {
    setEditingLimitUser(row);
    setLimitDraft({
      annualLimit: row.plan_limit.annual_planogram_limit?.toString() ?? "",
      isUnlimited: row.plan_limit.is_unlimited,
      useTierDefault: row.plan_limit.source === "tier",
    });
    setUserLimitError("");
    setUserLimitMessage("");
  };

  const closeLimitEditor = () => {
    setEditingLimitUser(null);
    setUserLimitError("");
  };

  const updateUserLimitState = (userId: string, planLimit: UserPlanLimit) => {
    const applyLimit = (row: SuperAdminUserRow) => (row.id === userId ? { ...row, plan_limit: planLimit } : row);
    setUsersRows((previous) => previous.map(applyLimit));
    setOnboardingRows((previous) => previous.map(applyLimit));
  };

  const saveUserLimit = async () => {
    if (!editingLimitUser) {
      return;
    }

    const parsedLimit = Number.parseInt(limitDraft.annualLimit, 10);
    if (!limitDraft.useTierDefault && !limitDraft.isUnlimited && (!Number.isFinite(parsedLimit) || parsedLimit < 1)) {
      setUserLimitError("Enter an annual limit of at least 1, or choose unlimited.");
      return;
    }

    setSavingUserLimit(true);
    setUserLimitError("");
    setUserLimitMessage("");
    try {
      const payload = limitDraft.useTierDefault
        ? { use_tier_default: true }
        : limitDraft.isUnlimited
          ? { is_unlimited: true }
          : { annual_planogram_limit: parsedLimit, is_unlimited: false };
      const response = await api.patch<UserPlanLimitResponse>(
        `/api/v1/admin/users/${editingLimitUser.id}/plan-limit`,
        payload,
      );
      updateUserLimitState(response.data.data.user_id, response.data.data.plan_limit);
      setUserLimitMessage(`Saved limits for ${editingLimitUser.username}.`);
      setEditingLimitUser(null);
    } catch {
      setUserLimitError(`Unable to save limits for ${editingLimitUser.username}.`);
    } finally {
      setSavingUserLimit(false);
    }
  };

  const reviewRequest = async (row: SuperAdminUserRow, status: "approved" | "rejected") => {
    setActionUserId(row.id);
    setRowsError("");
    try {
      await api.patch(`/api/v1/admin/onboarding/requests/${row.id}`, {
        status,
        review_note: status === "approved" ? "Approved by super admin." : "Rejected by super admin.",
      });
      const refreshed = await api.get<SuperAdminUsersResponse>(`/api/v1/admin/onboarding/requests?status=${requestFilter}`);
      setOnboardingRows(refreshed.data.data);
    } catch {
      setRowsError("Unable to review request.");
    } finally {
      setActionUserId(null);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-4">
      <header className="rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">Eureka</p>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user.first_name} {user.last_name}
            </span>
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
        </div>
      </header>

      {adminStats ? (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total users</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {adminStats.users.total}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {adminStats.users.approved} approved / {adminStats.users.pending} pending
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total stores</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {adminStats.stores.total}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">across all users</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total planograms</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {adminStats.planograms.total}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              of {adminStats.planograms.has_unlimited_users ? "unlimited" : adminStats.planograms.total_quota} quota
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Utilisation</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {adminStats.planograms.utilisation_pct !== null
                ? `${adminStats.planograms.utilisation_pct.toFixed(1)}%`
                : "-"}
            </p>
            {adminStats.planograms.utilisation_pct !== null ? (
              <progress
                className={`health-progress mt-2 ${
                  adminStats.planograms.utilisation_pct >= 90
                    ? "health-progress-red"
                    : adminStats.planograms.utilisation_pct >= 70
                      ? "health-progress-yellow"
                      : "health-progress-blue"
                }`}
                value={Math.min(100, adminStats.planograms.utilisation_pct)}
                max={100}
              >
                {adminStats.planograms.utilisation_pct.toFixed(1)}%
              </progress>
            ) : (
              <p className="mt-2 text-xs text-gray-500">unlimited users present</p>
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 bg-white text-gray-500 hover:border-blue-600 hover:text-blue-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {rowsError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
          {rowsError}
        </p>
      ) : null}

      {activeTab === "onboarding" ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Pilot Onboarding
              </h1>
              <span className="sr-only">Super Admin · Pilot Onboarding</span>
              <p className="mt-1 text-sm text-gray-500">
                Review brand signup applications. Approve to provision workspace, reject to dismiss request.
              </p>
            </div>
            <p className="text-sm text-gray-500">{requestsCountLabel}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setRequestFilter(filter.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                  requestFilter === filter.key ? FILTER_ACTIVE_STYLES[filter.key] : FILTER_INACTIVE_STYLE
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loadingRows ? (
            <p className="mt-4 text-sm text-gray-500">Loading requests...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {onboardingRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {row.company_name || "No company"}
                        </p>
                        <p className="text-xs text-gray-500">user: {row.username}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {row.first_name} {row.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {row.phone_number || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.approval_status]}`}>
                          {row.approval_status.toUpperCase()}
                        </span>
                        <p className="mt-1 text-xs text-gray-500">
                          reviewed {formatDate(row.reviewed_at)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {row.approval_status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={actionUserId === row.id}
                              onClick={() => void reviewRequest(row, "approved")}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionUserId === row.id}
                              onClick={() => void reviewRequest(row, "rejected")}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Users Table</h2>
          <p className="mt-1 text-sm text-gray-500">
            All registered users and profile details.
          </p>

          {loadingRows ? (
            <p className="mt-4 text-sm text-gray-500">Loading users...</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[var(--color-bg)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">First Name</th>
                    <th className="px-3 py-2">Last Name</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersRows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.first_name}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.last_name}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.username}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.email}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.phone_number || "-"}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.company_name || "-"}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{ROLE_LABELS[row.role]}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">{PLAN_LABELS[row.subscription_tier]}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.approval_status]}`}>
                          {row.approval_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "limits" ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Limits</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage per-user annual planogram limits. Tier defaults apply until a user override is saved.
          </p>

          {userLimitError ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
              {userLimitError}
            </p>
          ) : null}
          {userLimitMessage ? (
            <p className="mt-3 rounded-md border border-green-200 bg-green-100 px-3 py-2 text-sm text-green-600">
              {userLimitMessage}
            </p>
          ) : null}

          {loadingRows ? (
            <p className="mt-4 text-sm text-gray-500">Loading limits...</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[var(--color-bg)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">First Name</th>
                    <th className="px-3 py-2">Last Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Limits</th>
                    <th className="px-3 py-2">Usage</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersRows.map((row) => {
                    const limit = row.plan_limit.annual_planogram_limit ?? null;
                    const planogramCount = getPlanogramCount(row);
                    const utilisation =
                      limit && limit > 0 && !row.plan_limit.is_unlimited
                        ? Math.min(100, (planogramCount / limit) * 100)
                        : null;
                    const usageColor =
                      utilisation === null
                        ? "health-progress-blue"
                        : utilisation >= 90
                          ? "health-progress-red"
                          : utilisation >= 70
                            ? "health-progress-yellow"
                            : "health-progress-blue";
                    return (
                      <tr key={row.id} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-3 font-semibold text-[var(--color-text-primary)]">{row.username}</td>
                        <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.first_name}</td>
                        <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.last_name}</td>
                        <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.email}</td>
                        <td className="px-3 py-3 text-[var(--color-text-secondary)]">{row.phone_number || "-"}</td>
                        <td className="px-3 py-3 text-[var(--color-text-secondary)]">{PLAN_LABELS[row.subscription_tier]}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-[var(--color-text-primary)]">{formatLimit(row.plan_limit)}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.plan_limit.source === "override"
                                ? "bg-[var(--color-blue-100)] text-[var(--color-blue-800)]"
                                : "bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]"
                            }`}
                          >
                            {row.plan_limit.source === "override" ? "Override" : "Tier default"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {planogramCount}
                            {row.plan_limit.is_unlimited ? " / unlimited" : limit ? ` / ${limit}` : ""}
                          </p>
                          {utilisation !== null ? (
                            <progress className={`health-progress mt-1 w-24 ${usageColor}`} value={utilisation} max={100}>
                              {utilisation.toFixed(0)}%
                            </progress>
                          ) : (
                            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                              {row.plan_limit.is_unlimited ? "Unlimited" : "No limit set"}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            aria-label={`Edit limits for ${row.username}`}
                            onClick={() => openLimitEditor(row)}
                            className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-blue-700)]"
                          >
                            Limits
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {editingLimitUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-editor-title"
            className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {PLAN_LABELS[editingLimitUser.subscription_tier]}
                </p>
                <h3 id="limit-editor-title" className="mt-1 text-base font-semibold text-gray-900">
                  Edit limits for {editingLimitUser.username}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {editingLimitUser.first_name} {editingLimitUser.last_name} / {editingLimitUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeLimitEditor}
                className="rounded-md bg-transparent px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            {userLimitError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-800">
                {userLimitError}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                <input
                  type="checkbox"
                  checked={limitDraft.useTierDefault}
                  onChange={(event) =>
                    setLimitDraft((previous) => ({ ...previous, useTierDefault: event.target.checked }))
                  }
                />
                Use {PLAN_LABELS[editingLimitUser.subscription_tier]} tier default
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <input
                  type="checkbox"
                  checked={limitDraft.isUnlimited}
                  disabled={limitDraft.useTierDefault}
                  onChange={(event) =>
                    setLimitDraft((previous) => ({
                      ...previous,
                      isUnlimited: event.target.checked,
                      annualLimit: event.target.checked ? "" : previous.annualLimit,
                    }))
                  }
                />
                Unlimited
              </label>

              <label className="block text-sm font-medium text-gray-900">
                Annual planogram limit
                <input
                  aria-label="Annual planogram limit"
                  type="number"
                  min={1}
                  disabled={limitDraft.useTierDefault || limitDraft.isUnlimited}
                  value={limitDraft.annualLimit}
                  onChange={(event) =>
                    setLimitDraft((previous) => ({ ...previous, annualLimit: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeLimitEditor}
                className="rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingUserLimit}
                onClick={() => void saveUserLimit()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingUserLimit ? "Saving..." : "Save limits"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
