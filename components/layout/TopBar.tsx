"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, PlusCircle, UserCircle2 } from "lucide-react";
import { App, Modal } from "antd";
import GlobalSearch from "@/components/common/GlobalSearch";
import { clearAuthToken, getAuthProfile, getRefreshToken } from "@/lib/auth/token";
import { authApi } from "@/lib/api";

export default function TopBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState("Account");
  const [changeOpen, setChangeOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const { message } = App.useApp();
  const { role } = getAuthProfile();
  const isSalesReport = role === "sales_report";

  const isPasswordValid = useMemo(() => newPassword.length >= 8, [newPassword]);
  const doesMatch = useMemo(
    () => newPassword.length > 0 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  const resetChangeForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setChangeError(null);
  };

  const handleChangePassword = async () => {
    if (!isPasswordValid) {
      setChangeError("Password must be at least 8 characters.");
      return;
    }
    if (!doesMatch) {
      setChangeError("Passwords do not match.");
      return;
    }
    setChanging(true);
    setChangeError(null);
    try {
      await authApi.changePassword(newPassword);
      message.success("Password updated.");
      setChangeOpen(false);
      resetChangeForm();
    } catch (err) {
      setChangeError("Unable to update password. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  useEffect(() => {
    const profile = getAuthProfile();
    if (profile.name) {
      setProfileName(profile.name);
    }
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-surface-base/60 px-6 py-4 backdrop-blur">
      {isSalesReport ? (
        <div className="flex min-w-[240px] flex-1 items-center gap-4" />
      ) : (
        <div className="flex min-w-[240px] flex-1 items-center gap-4">
          <GlobalSearch />
        </div>
      )}
      <div className="flex items-center gap-3">
        {isSalesReport ? null : (
          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-black shadow-soft transition hover:brightness-110"
          >
            <PlusCircle size={18} />
            Create Task
          </Link>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-2 text-sm text-text-muted hover:text-text-primary"
          >
            <UserCircle2 size={18} />
            {profileName}
          </button>
          {open ? (
            <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-border-subtle bg-surface-card p-2 shadow-card">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setChangeOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary"
              >
                <KeyRound size={16} />
                Change Password
              </button>
              <button
                type="button"
                onClick={async () => {
                  const refreshToken = getRefreshToken();
                  try {
                    await authApi.logout(refreshToken);
                  } finally {
                    clearAuthToken();
                    router.push("/login");
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <Modal
        title="Change Password"
        open={changeOpen}
        onCancel={() => {
          setChangeOpen(false);
          resetChangeForm();
        }}
        onOk={handleChangePassword}
        okText="Update"
        okButtonProps={{ disabled: !isPasswordValid || !doesMatch, loading: changing }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
              placeholder="Enter new password"
            />
            {newPassword.length > 0 && !isPasswordValid ? (
              <p className="mt-2 text-xs text-rose-300">
                Minimum 8 characters required.
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Re-enter Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
              placeholder="Re-enter new password"
            />
            {confirmPassword.length > 0 && !doesMatch ? (
              <p className="mt-2 text-xs text-rose-300">Passwords must match.</p>
            ) : null}
          </div>
          {changeError ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
              {changeError}
            </div>
          ) : null}
        </div>
      </Modal>
    </header>
  );
}
