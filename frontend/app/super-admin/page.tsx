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
  data: AdminStats;
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
  approved: "bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]",
  pending: "bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)]",
  rejected: "bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]",
};

const FILTER_ACTIVE_STYLES: Record<RequestFilter, string> = {
  pending:
    "border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)]",
  approved:
    "border border-[var(--color-status-green-text)] bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]",
  rejected:
    "border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]",
  all: "border border-[var(--color-blue-600)] bg-[var(--color-blue-100)] text-[var(--color-blue-800)]",
};

const FILTER_INACTIVE_STYLE =
  "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-600)] hover:text-[var(--color-blue-600)]";

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
        setAdminStats(statsResponse.data.data);
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
    <main className="min-h-screen bg-[var(--color-bg-subtle)] px-6 py-4">
      <header className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Super Admin</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {user.first_name} {user.last_name}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-[var(--color-blue-600)] hover:text-[var(--color-blue-700)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {adminStats ? (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Total users</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {adminStats.users.total}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {adminStats.users.approved} approved · {adminStats.users.pending} pending
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Total stores</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {adminStats.stores.total}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">across all users</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Total planograms</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {adminStats.planograms.total}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              of {adminStats.planograms.has_unlimited_users ? "∞" : adminStats.planograms.total_quota} quota
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Utilisation</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {adminStats.planograms.utilisation_pct !== null
                ? `${adminStats.planograms.utilisation_pct.toFixed(1)}%`
                : "—"}
            </p>
            {adminStats.planograms.utilisation_pct !== null ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                <div
                  className={`h-full ${
                    adminStats.planograms.utilisation_pct >= 90
                      ? "bg-[var(--color-status-red-text)]"
                      : adminStats.planograms.utilisation_pct >= 70
                        ? "bg-[var(--color-status-yellow-text)]"
                        : "bg-[var(--color-status-green-text)]"
                  }`}
                  style={{
                    width: `${Math.min(100, adminStats.planograms.utilisation_pct)}%`,
                  }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">unlimited users present</p>
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-[var(--color-text-primary)] text-white"
                  : "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-600)] hover:text-[var(--color-blue-600)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {rowsError ? (
        <p className="mt-4 rounded-md border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
          {rowsError}
        </p>
      ) : null}

      {activeTab === "onboarding" ? (
        <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                Super Admin · Pilot Onboarding
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Review brand signup applications. Approve to provision workspace, reject to dismiss request.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">{requestsCountLabel}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setRequestFilter(filter.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  requestFilter === filter.key ? FILTER_ACTIVE_STYLES[filter.key] : FILTER_INACTIVE_STYLE
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loadingRows ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Loading requests...</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[var(--color-bg)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Brand</th>
                    <th className="px-3 py-2">Applicant</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Submitted</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {onboardingRows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {row.company_name || "No company"}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">user: {row.username}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {row.first_name} {row.last_name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{row.email}</p>
                      </td>
                      <td className="px-3 py-3 text-[var(--color-text-secondary)]">
                        {row.phone_number || "-"}
                      </td>
                      <td className="px-3 py-3 text-[var(--color-text-secondary)]">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.approval_status]}`}>
                          {row.approval_status.toUpperCase()}
                        </span>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          reviewed {formatDate(row.reviewed_at)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {row.approval_status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={actionUserId === row.id}
                              onClick={() => void reviewRequest(row, "approved")}
                              className="rounded-md bg-[var(--color-status-green-text)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionUserId === row.id}
                              onClick={() => void reviewRequest(row, "rejected")}
                              className="rounded-md bg-[var(--color-status-red-text)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">-</span>
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
        <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Users Table</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            All registered users and profile details.
          </p>

          {loadingRows ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Loading users...</p>
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
        <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Limits</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage per-user annual planogram limits. Tier defaults apply until a user override is saved.
          </p>

          {userLimitError ? (
            <p className="mt-3 rounded border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
              {userLimitError}
            </p>
          ) : null}
          {userLimitMessage ? (
            <p className="mt-3 rounded border border-[var(--color-status-green-text)] bg-[var(--color-status-green-bg)] px-3 py-2 text-sm text-[var(--color-status-green-text)]">
              {userLimitMessage}
            </p>
          ) : null}

          {loadingRows ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Loading limits...</p>
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
                    const utilisation =
                      limit && limit > 0 && !row.plan_limit.is_unlimited
                        ? Math.min(100, (row.planogram_count / limit) * 100)
                        : null;
                    const usageColor =
                      utilisation === null
                        ? "bg-[var(--color-border)]"
                        : utilisation >= 90
                          ? "bg-[var(--color-status-red-text)]"
                          : utilisation >= 70
                            ? "bg-[var(--color-status-yellow-text)]"
                            : "bg-[var(--color-status-green-text)]";
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
                            {row.planogram_count}
                            {row.plan_limit.is_unlimited ? " / ∞" : limit ? ` / ${limit}` : ""}
                          </p>
                          {utilisation !== null ? (
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                              <div
                                className={`h-full ${usageColor}`}
                                style={{ width: `${utilisation}%` }}
                              />
                            </div>
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
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {PLAN_LABELS[editingLimitUser.subscription_tier]}
                </p>
                <h3 id="limit-editor-title" className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                  Edit limits for {editingLimitUser.username}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {editingLimitUser.first_name} {editingLimitUser.last_name} · {editingLimitUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeLimitEditor}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-blue-600)]"
              >
                Close
              </button>
            </div>

            {userLimitError ? (
              <p className="mt-4 rounded border border-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red-text)]">
                {userLimitError}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={limitDraft.useTierDefault}
                  onChange={(event) =>
                    setLimitDraft((previous) => ({ ...previous, useTierDefault: event.target.checked }))
                  }
                />
                Use {PLAN_LABELS[editingLimitUser.subscription_tier]} tier default
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
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

              <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
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
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none transition focus:ring focus:ring-[var(--color-blue-100)] disabled:bg-[var(--color-bg-muted)]"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeLimitEditor}
                className="rounded-lg border border-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-[var(--color-blue-600)] hover:bg-[var(--color-blue-100)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingUserLimit}
                onClick={() => void saveUserLimit()}
                className="rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-blue-700)] disabled:opacity-60"
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
