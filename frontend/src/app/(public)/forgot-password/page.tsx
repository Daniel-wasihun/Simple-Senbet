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
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "We couldn't send a reset link. Please try again.");
      setSent(true);
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "We couldn't send a reset link."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-6xl items-center justify-center px-5 py-14"><section className="w-full max-w-md border-t-2 border-[#102746] bg-[#f8f7f3] p-7 sm:p-9"><div className="grid h-12 w-12 place-items-center border-b border-[#b59660] text-[#244a72]"><KeyRound className="h-5 w-5" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#8c7140]">Account recovery</p><h1 className="mt-2 font-serif text-3xl font-semibold text-[#102746]">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-[#78818b]">Enter the email address connected to your school account. If it exists, we'll send a reset link.</p>
    {error && <div role="alert" className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    {sent ? <div role="status" className="mt-6 rounded-sm border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5" /> Check your email</div><p className="mt-2 text-sm leading-6 text-emerald-800">If an account is registered with <strong>{email}</strong>, a password reset link is on its way.</p><Link href="/login" className="mt-4 inline-flex text-sm font-bold text-[#244a72] hover:underline">Return to sign in</Link></div> : <form onSubmit={handleSubmit} className="mt-7 space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34465b]">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89929b]" /><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" placeholder="you@example.com" /></div></div><button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#102746] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#17385e] disabled:opacity-55">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending...</> : "Send reset link"}</button></form>}
    <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#697687] hover:text-[#102746]"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link></section></main>;
}
