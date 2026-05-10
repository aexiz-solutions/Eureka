"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import { resolvePostLoginRoute, useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, token, user, initializeAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvalInfo, setApprovalInfo] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("approval") === "pending") {
      setApprovalInfo("Signup request submitted. Email will be sent to you once you are approved by admin.");
    }
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    let cancelled = false;
    void (async () => {
      const target = await resolvePostLoginRoute(user);
      if (!cancelled) {
        router.replace(target);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, token, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authenticatedUser = await login(email, password);
      const target = await resolvePostLoginRoute(authenticatedUser);
      router.push(target);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data?.error;
        if (apiError === "account_pending_approval") {
          setError("Your account is pending admin approval.");
        } else if (apiError === "account_rejected") {
          setError("Your signup request was rejected by admin. Please contact support.");
        } else {
          setError("Unable to sign in. Check your credentials and try again.");
        }
      } else {
        setError("Unable to sign in. Check your credentials and try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] p-6">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in after your onboarding request is approved."
        ctaLabel="Sign In"
        footer={
          <>
            New to Eureka?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--color-blue-600)] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {approvalInfo ? (
          <p className="rounded border border-[var(--color-status-yellow-text)] bg-[var(--color-status-yellow-bg)] px-3 py-2 text-sm text-[var(--color-status-yellow-text)]">
            {approvalInfo}
          </p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none transition focus:border-[var(--color-blue-600)] focus:ring focus:ring-[var(--color-blue-100)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none transition focus:border-[var(--color-blue-600)] focus:ring focus:ring-[var(--color-blue-100)]"
          />
        </div>
      </AuthCard>
    </main>
  );
}
