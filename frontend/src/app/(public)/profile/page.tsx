"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { profileService } from "@/services/profile.service";

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    if (user) { setName(user.name); setEmail(user.email); }
  }, [isLoading, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await profileService.update({ name: name.trim(), email: email.trim() }, user?.id);
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? t("profile.saveFailed", { defaultValue: "Could not update your profile." }));
      await refreshUser();
      toast.success(t("profile.saved", { defaultValue: "Profile updated." }));
    } catch (error) { toast.error(error instanceof Error ? error.message : t("profile.saveFailed", { defaultValue: "Could not update your profile." })); }
    finally { setBusy(false); }
  }

  if (isLoading || !user) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-slate-500">{t("profile.loading", { defaultValue: "Loading profile…" })}</div>;
  const input = "mt-1.5 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  return <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{t("profile.eyebrow", { defaultValue: "Account settings" })}</p><h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900 dark:text-white">{t("profile.title", { defaultValue: "Your profile" })}</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t("profile.intro", { defaultValue: "Keep your school account details up to date." })}</p>
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div><label htmlFor="profile-name" className="text-sm font-medium">{t("profile.name", { defaultValue: "Full name" })}</label><input id="profile-name" className={input} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={255} /></div><div><label htmlFor="profile-email" className="text-sm font-medium">{t("profile.email", { defaultValue: "Email address" })}</label><input id="profile-email" className={input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={255} /></div><div className="border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">{t("profile.role", { defaultValue: "School role" })}: <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{user.role.replaceAll("_", " ")}</span></div><button disabled={busy} className="min-h-11 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60">{busy ? t("profile.saving", { defaultValue: "Saving…" }) : t("profile.save", { defaultValue: "Save changes" })}</button></form></main>;
}
