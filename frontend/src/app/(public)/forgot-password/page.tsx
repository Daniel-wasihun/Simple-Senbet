"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Could not process reset link. Please try again.");
      setSent(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] py-16 px-4 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-7 sm:p-9 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0ebd9] dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f243e] dark:bg-[#1c2438] text-[#dfc896] dark:text-[#fba81c]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
                የይለፍ ቃል መልሶ ማግኛ
              </p>
              <h1 className="font-serif text-2xl font-bold text-[#0f243e] dark:text-slate-100">Reset Password</h1>
            </div>
          </div>
          <span className="text-xl text-[#8c7140] dark:text-[#fba81c]">✝</span>
        </div>

        <p className="text-xs sm:text-sm leading-6 text-[#5f7081] dark:text-slate-400">
          Enter the email address registered with your Sunday School account. If it exists in the system,
          a secure password reset link will be dispatched.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 leading-relaxed"
          >
            {error}
          </div>
        )}

        {sent ? (
          <div
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 p-5 text-center space-y-3"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-emerald-950 dark:text-emerald-200">Instructions Dispatched</h3>
            <p className="text-xs leading-5 text-emerald-800 dark:text-emerald-300">
              If an account is associated with <strong>{email}</strong>, you will receive password reset instructions.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f243e] dark:text-[#fba81c] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                Account Email / ኢሜይል
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7140] dark:text-[#fba81c]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-[#d2d8dc] dark:border-slate-700 bg-[#fdfbf7] dark:bg-[#1c2438] text-[#132438] dark:text-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0f243e] dark:focus:border-[#fba81c] focus:ring-4 focus:ring-[#0f243e]/10 dark:focus:ring-[#fba81c]/10 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f243e] dark:bg-[#fba81c] hover:bg-[#1a385f] dark:hover:bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#dfc896] dark:text-slate-900" />
                  <span>Sending reset instructions...</span>
                </>
              ) : (
                "Send Password Reset Link"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#f0ebd9] dark:border-slate-800 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#657686] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-[#fba81c]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
