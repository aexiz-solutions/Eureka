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
    <main className="flex min-h-screen items-center justify-center bg-white py-6">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in after your onboarding request is approved."
        ctaLabel="Sign In"
        footer={
          <>
            New to Eureka?{" "}
            <Link href="/register" className="font-medium text-blue-600 underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {approvalInfo ? (
          <p className="rounded-md border border-yellow-200 bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
            {approvalInfo}
          </p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </AuthCard>
    </main>
  );
}
