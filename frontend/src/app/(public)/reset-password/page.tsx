"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { authService } from "@/services/auth.service";

function ResetForm() {
  const { t } = useTranslation();
  const auth = (key: string) => t(`public.auth.${key}`);
  const params = useSearchParams();
  const token = params.get("token") || "";
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authService.resetPassword({
          token,
          email: email.trim(),
          password,
          password_confirmation: confirmation,
        });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "This reset token is invalid or has expired.");
      setDone(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2438] text-[#132438] dark:text-slate-100 px-4 py-2.5 text-sm outline-none transition focus:border-[#1D4ED8] dark:focus:border-[#93c5fd] focus:ring-4 focus:ring-[#1D4ED8]/10 dark:focus:ring-[#93c5fd]/10 placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141a29] p-7 sm:p-9 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#f0ebd9] dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1D4ED8] dark:bg-[#1c2438] text-[#dbeafe] dark:text-[#93c5fd]">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB] dark:text-[#93c5fd]">
              አዲስ የይለፍ ቃል ማዘጋጀት
            </p>
            <h1 className="font-serif text-2xl font-bold text-[#1D4ED8] dark:text-slate-100">{auth("newPassword")}</h1>
          </div>
        </div>
        <span className="text-xl text-[#2563EB] dark:text-[#93c5fd]">✝</span>
      </div>

      {!token && !done && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed"
        >
          {auth("missingToken")}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 leading-relaxed"
        >
          {error}
        </div>
      )}

      {done ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 p-5 text-center space-y-3"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-emerald-950 dark:text-emerald-200">{auth("passwordUpdated")}</h3>
          <p className="text-xs leading-5 text-emerald-800 dark:text-emerald-300">
            {auth("passwordUpdatedCopy")}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#1D4ED8] dark:bg-[#2563EB] hover:bg-[#2563EB] dark:hover:bg-[#315c86] px-5 py-2.5 text-xs font-semibold text-white dark:text-white shadow-xs"
            >
              {auth("goSignIn")}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
              {auth("email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
              {auth("newPassword")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmation" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
              {auth("confirmNewPassword")}
            </label>
            <input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={inputClass}
              placeholder="Repeat new password"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !token}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] dark:bg-[#2563EB] hover:bg-[#2563EB] dark:hover:bg-[#315c86] px-5 py-3 text-sm font-semibold text-white dark:text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin text-[#dbeafe] dark:text-slate-900" />
                <span>{auth("updating")}</span>
              </>
            ) : (
              auth("updatePassword")
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-[#f0ebd9] dark:border-slate-800 text-center">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#657686] dark:text-slate-400 hover:text-[#1D4ED8] dark:hover:text-[#93c5fd]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {auth("requestLink")}
        </Link>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-white dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] py-16 px-4 flex items-center justify-center">
      <Suspense fallback={<div className="text-xs text-[#687586] dark:text-slate-400">Loading...</div>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
