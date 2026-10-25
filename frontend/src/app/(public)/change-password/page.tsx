"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { profileService } from "@/services/profile.service";

export default function ChangePasswordPage() {
  const { user, isLoading, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => { if (!isLoading && !user) router.replace("/login"); }, [isLoading, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await profileService.changePassword({ current_password: currentPassword, password, password_confirmation: confirmation }, user?.id);
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? t("profile.passwordFailed", { defaultValue: "Could not change your password." }));
      toast.success(t("profile.passwordChanged", { defaultValue: "Password changed. Sign in again with your new password." }));
      await logout();
    } catch (error) { toast.error(error instanceof Error ? error.message : t("profile.passwordFailed", { defaultValue: "Could not change your password." })); }
    finally { setBusy(false); }
  }

  if (isLoading || !user) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-slate-500">{t("profile.loading", { defaultValue: "Loading profile…" })}</div>;
  const input = "mt-1.5 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  return <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{t("profile.eyebrow", { defaultValue: "Account settings" })}</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900 dark:text-white">{t("profile.menuPassword", { defaultValue: "Change password" })}</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t("profile.passwordIntro", { defaultValue: "Choose a new password for your school account." })}</p>
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div><label htmlFor="current-password" className="text-sm font-medium">{t("profile.currentPassword", { defaultValue: "Current password" })}</label><input id="current-password" className={input} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div><div><label htmlFor="new-password" className="text-sm font-medium">{t("profile.newPassword", { defaultValue: "New password" })}</label><input id="new-password" className={input} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div><div><label htmlFor="confirm-password" className="text-sm font-medium">{t("profile.confirmPassword", { defaultValue: "Confirm new password" })}</label><input id="confirm-password" className={input} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} /></div><button disabled={busy} className="min-h-11 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60">{busy ? t("profile.saving", { defaultValue: "Updating…" }) : t("profile.updatePassword", { defaultValue: "Update password" })}</button></form></main>;
}
