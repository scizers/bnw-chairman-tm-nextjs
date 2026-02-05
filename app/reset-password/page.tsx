"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/bnw-logo.png";
import { authApi } from "@/lib/api";
import { App } from "antd";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  const isPasswordValid = useMemo(() => password.length >= 8, [password]);
  const doesMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [password, confirmPassword]
  );

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setValidating(false);
      setIsTokenValid(false);
      return;
    }
    const validate = async () => {
      setValidating(true);
      setError(null);
      try {
        await authApi.validateResetToken(token);
        if (isMounted) setIsTokenValid(true);
      } catch (err) {
        if (isMounted) setIsTokenValid(false);
      } finally {
        if (isMounted) setValidating(false);
      }
    };
    void validate();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!doesMatch) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      message.success("Password updated. Please log in.");
      router.push("/login");
    } catch (err) {
      setError("Unable to reset password. Please request a new link.");
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
          <h1 className="mt-2 font-display text-3xl text-text-primary">
            Reset Password
          </h1>
        </div>

        {validating ? (
          <p className="mt-6 text-center text-sm text-text-muted">Validating link…</p>
        ) : null}

        {!validating && !isTokenValid ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            This reset link is invalid or has expired.
          </div>
        ) : null}

        {!validating && isTokenValid ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
                placeholder="Enter new password"
                required
              />
              {password.length > 0 && !isPasswordValid ? (
                <p className="mt-2 text-xs text-rose-300">
                  Minimum 8 characters required.
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
                placeholder="Re-enter new password"
                required
              />
              {confirmPassword.length > 0 && !doesMatch ? (
                <p className="mt-2 text-xs text-rose-300">Passwords must match.</p>
              ) : null}
            </div>
            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !doesMatch}
              className="w-full rounded-full bg-brand-primary py-3 text-sm font-semibold text-black shadow-soft transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : null}

        <div className="mt-4 text-center text-xs text-text-muted">
          <Link href="/forgot-password" className="text-brand-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    </div>
  );
}
