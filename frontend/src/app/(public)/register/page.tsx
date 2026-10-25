"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { ROLE_DASHBOARDS } from "@/utils/roleNavigation";

export default function RegisterPage() {
  const { user, isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          role: form.get("role"),
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (response.status === 403
              ? "Your account does not have permission to register new users. Only authorized administrators can perform this action."
              : "Unable to create this account. Please verify input data.")
        );
      }

      setMessage(`Account created successfully for ${data?.user?.name || "the new member"}. They can now sign in.`);
      formElement.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this account.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#d2d8dc] dark:border-slate-700 bg-[#fdfbf7] dark:bg-[#1c2438] text-[#132438] dark:text-slate-100 px-4 py-2.5 text-sm outline-none transition focus:border-[#0f243e] dark:focus:border-[#fba81c] focus:ring-4 focus:ring-[#0f243e]/10 dark:focus:ring-[#fba81c]/10 placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Left Information */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a866]/60 dark:border-[#fba81c]/30 bg-[#f4ecd9] dark:bg-[#141a29] px-3.5 py-1 text-xs font-semibold text-[#665335] dark:text-[#fba81c]">
            <span>✝</span>
            <span>የአባላትና የአገልጋዮች ምዝገባ | Member Enrollment</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0f243e] dark:text-slate-100 leading-tight">
            Provisioning Authorized Accounts.
          </h1>

          <p className="text-sm sm:text-base leading-7 text-[#586a7b] dark:text-slate-400">
            In the Ethiopian Orthodox Tewahedo Church Sunday School system, user accounts are protected
            and provisioned by authorized coordinators and administrators to safeguard parish records.
          </p>

          <div className="rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#141a29] p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8c7140] dark:text-[#fba81c] uppercase tracking-[0.14em]">
              <ShieldCheck className="h-4 w-4" />
              <span>Permission Protected Action</span>
            </div>
            <p className="text-xs sm:text-sm text-[#5f7081] dark:text-slate-400 leading-relaxed">
              If you are a student or parent seeking registration, please contact your parish Sunday School
              office directly. If you are an authorized administrator, sign in to provision member accounts.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c7140] dark:text-[#fba81c] hover:text-[#0f243e] dark:hover:text-[#f59e0b] transition"
              >
                <span>Already have an account? Sign in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Right Form Card */}
        <section className="rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-7 sm:p-9 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0ebd9] dark:border-slate-800 pb-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c7140] dark:text-[#fba81c]">
                አዲስ አባል ማከል
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#0f243e] dark:text-slate-100">Create User Account</h2>
            </div>
            <span className="text-xl text-[#8c7140] dark:text-[#fba81c]">✝</span>
          </div>

          {!isLoading && !user && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed"
            >
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Administrator Authentication Required:</strong> You are not currently signed in.
                Public registration is restricted. Please sign in with an account having user registration
                permissions.
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 leading-relaxed"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                Full Name / ሙሉ ስም
              </label>
              <input id="name" name="name" required maxLength={255} className={inputClass} placeholder="Full Name" />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                Email Address / ኢሜይል
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                className={inputClass}
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                Sunday School Department Role / የአገልግሎት ሚና
              </label>
              <select id="role" name="role" required defaultValue="student" className={inputClass}>
                {Object.values(ROLE_DASHBOARDS).map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label} ({r.amharicLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                  Password / የይለፍ ቃል
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="At least 8 chars"
                />
              </div>
              <div>
                <label htmlFor="password_confirmation" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                  Confirm Password / አረጋግጥ
                </label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f243e] dark:bg-[#fba81c] hover:bg-[#1a385f] dark:hover:bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#dfc896] dark:text-slate-900" />
                  <span>Creating user record...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 text-[#dfc896] dark:text-slate-900" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#f0ebd9] dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/" className="inline-flex items-center gap-1 font-medium text-[#657686] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-[#fba81c]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
            <Link href="/login" className="font-semibold text-[#8c7140] dark:text-[#fba81c] hover:text-[#0f243e] dark:hover:text-[#f59e0b]">
              Sign in to Portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
