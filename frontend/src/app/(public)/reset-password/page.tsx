"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";

function ResetForm() {
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
          password_confirmation: confirmation,
        }),
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
    "w-full rounded-xl border border-[#d2d8dc] bg-[#fdfbf7] px-4 py-2.5 text-sm outline-none transition focus:border-[#0f243e] focus:ring-4 focus:ring-[#0f243e]/10";

  return (
    <section className="w-full max-w-md rounded-2xl border border-[#d8ccb4] bg-white p-7 sm:p-9 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f0ebd9] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f243e] text-[#dfc896]">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7140]">
              አዲስ የይለፍ ቃል ማዘጋጀት
            </p>
            <h1 className="font-serif text-2xl font-bold text-[#0f243e]">New Password</h1>
          </div>
        </div>
        <span className="text-xl text-[#8c7140]">✝</span>
      </div>

      {!token && !done && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed"
        >
          This password reset link is missing a verification token. Please request a fresh reset link.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 leading-relaxed"
        >
          {error}
        </div>
      )}

      {done ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-center space-y-3"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-emerald-950">Password Successfully Updated</h3>
          <p className="text-xs leading-5 text-emerald-800">
            Your account password has been changed. You can now sign in with your new credentials.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f243e] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1a385f]"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
              Email Address / ኢሜይል
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
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
              New Password / አዲስ የይለፍ ቃል
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
            <label htmlFor="confirmation" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
              Confirm New Password / አረጋግጥ
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f243e] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1a385f] disabled:opacity-50 transition"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin text-[#dfc896]" />
                <span>Updating password...</span>
              </>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-[#f0ebd9] text-center">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#657686] hover:text-[#0f243e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Request a New Link
        </Link>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#fcfaf5] py-16 px-4 flex items-center justify-center">
      <Suspense fallback={<div className="text-xs text-[#687586]">Loading verification token...</div>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
