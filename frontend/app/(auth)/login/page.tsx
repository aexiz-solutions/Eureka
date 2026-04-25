"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, token, initializeAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginAs, setLoginAs] = useState<"admin" | "individual plus" | "individual pro" | "enterprise">(
    "individual plus",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [router, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, loginAs);
      router.push("/dashboard");
    } catch (err) {
      setError("Unable to sign in. Check your credentials and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to continue designing and analyzing your store layouts."
        ctaLabel="Sign In"
        footer={
          <>
            New to Eureka?{" "}
            <Link href="/register" className="font-semibold text-pine underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Login as</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["admin", "Admin"],
              ["individual plus", "Individual Plus"],
              ["individual pro", "Individual Pro"],
              ["enterprise", "Enterprise"],
            ].map(([value, label]) => {
              const active = loginAs === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLoginAs(value as typeof loginAs)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-pine bg-pine text-white"
                      : "border-ink/20 bg-white text-ink hover:border-pine/60 hover:bg-pine/5"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-ink/20 px-3 py-2 outline-none ring-pine/30 transition focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-ink/20 px-3 py-2 outline-none ring-pine/30 transition focus:ring"
          />
        </div>
      </AuthCard>
    </main>
  );
}
