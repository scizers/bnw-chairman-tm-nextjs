"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import logo from "@/public/bnw-logo.png";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { persistAuthSession } from "@/lib/auth/token";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }, [email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      const token = response?.token;
      const refreshToken = response?.refreshToken;
      if (!token || !refreshToken) {
        throw new Error("Token missing from response.");
      }
      persistAuthSession(token, refreshToken, response?.user);
      router.push("/dashboard");
    } catch (err) {
      setError("Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-card p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center p-2">
            <Image
              src={logo}
              alt="BNW logo"
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-text-muted">
            Chairman Office
          </p>
          <h1 className="mt-2 font-display text-3xl text-text-primary">Secure Sign-In</h1>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Access the executive back office task management system.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
              placeholder="chairman@office.local"
              required
            />
            {email.trim().length > 0 && !isEmailValid ? (
              <p className="mt-2 text-xs text-rose-300">Enter a valid email address.</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
              placeholder="Enter password"
              required
            />
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading || !isEmailValid}
            className="w-full rounded-full bg-brand-primary py-3 text-sm font-semibold text-black shadow-soft transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
