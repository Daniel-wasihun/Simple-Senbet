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
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email: email.trim(), password, password_confirmation: confirmation }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "This reset link is invalid or has expired.");
      setDone(true);
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "We couldn't reset your password."); }
    finally { setBusy(false); }
  }

  return <section className="w-full max-w-md border-t-2 border-[#102746] bg-[#f8f7f3] p-7 sm:p-9"><div className="grid h-12 w-12 place-items-center border-b border-[#b59660] text-[#244a72]"><KeyRound className="h-5 w-5" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#8c7140]">Account recovery</p><h1 className="mt-2 font-serif text-3xl font-semibold text-[#102746]">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-[#78818b]">Use a strong password you haven't used for this account before.</p>
    {!token && !done && <div role="alert" className="mt-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">This reset link is missing its token. Request a new link to continue.</div>}
    {error && <div role="alert" className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    {done ? <div role="status" className="mt-6 rounded-sm border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5" /> Password updated</div><p className="mt-2 text-sm leading-6 text-emerald-800">Your password has been changed. Sign in with your new password.</p><Link href="/login" className="mt-4 inline-flex font-bold text-[#244a72] hover:underline">Go to sign in</Link></div> : <form onSubmit={handleSubmit} className="mt-7 space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34465b]">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" /></div><div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#34465b]">New password</label><input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" /></div><div><label htmlFor="confirmation" className="mb-2 block text-sm font-semibold text-[#34465b]">Confirm new password</label><input id="confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" /></div><button type="submit" disabled={busy || !token} className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#102746] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#17385e] disabled:cursor-not-allowed disabled:opacity-55">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Updating...</> : "Update password"}</button></form>}
    <Link href="/forgot-password" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#697687] hover:text-[#102746]"><ArrowLeft className="h-3.5 w-3.5" /> Request another link</Link></section>;
}

export default function ResetPasswordPage() {
  return <main className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-6xl items-center justify-center px-5 py-14"><Suspense fallback={<div className="text-sm text-[#687586]">Loading reset link...</div>}><ResetForm /></Suspense></main>;
}
