"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";

const roles = ["student", "teacher", "academic_director", "academic_administrator", "superadmin"];

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
          name: form.get("name"), email: form.get("email"), role: form.get("role"),
          password: form.get("password"), password_confirmation: form.get("password_confirmation"),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || (response.status === 403 ? "Your account does not have permission to register users." : "Unable to create this account."));
      setMessage(`Account created for ${data?.user?.name || "the new member"}. They can now sign in.`);
      formElement.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[.85fr_1fr] lg:px-8">
      <section className="max-w-lg"><div className="grid h-12 w-12 place-items-center border-b border-[#b59660] text-[#102746]"><UserPlus className="h-5 w-5" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#8c7140]">School account setup</p><h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#102746] sm:text-5xl">Welcome someone into your school community.</h1><p className="mt-5 text-base leading-8 text-[#687586]">Create a student, teacher, or school staff account so they can take part in learning and service.</p><div className="mt-7 flex gap-3 border-l-2 border-[#b59660] bg-[#efede6] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#52705c]" /><p className="text-sm leading-6 text-[#697687]">Account creation is managed by authorized school staff. New members should contact their parish Sunday School to get started.</p></div><Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#244a72] hover:text-[#8c7140]">Already have an account? Sign in <ArrowRight className="h-4 w-4" /></Link></section>
      <section className="w-full border-t-2 border-[#102746] bg-[#f8f7f3] p-7 sm:p-9"><h2 className="font-serif text-3xl font-semibold text-[#102746]">Create an account</h2><p className="mt-2 text-sm leading-6 text-[#78818b]">Authorized administrators can add people to their school.</p>
        {!isLoading && !user && <div className="mt-5 rounded-sm border border-[#e5dcc8] bg-[#f4efdf] px-4 py-3 text-sm leading-6 text-[#735c31]">Please sign in with an administrator account. Public self-registration is not enabled for this school.</div>}
        {error && <div role="alert" className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
        {message && <div role="status" className="mt-5 flex gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4"><div><label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#34465b]">Full name</label><input id="name" name="name" required maxLength={255} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" placeholder="Name" /></div><div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34465b]">Email address</label><input id="email" name="email" type="email" required maxLength={255} autoComplete="email" className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" placeholder="you@example.com" /></div><div><label htmlFor="role" className="mb-2 block text-sm font-semibold text-[#34465b]">School role</label><select id="role" name="role" required defaultValue="student" className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10">{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#34465b]">Password</label><input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" /></div><div><label htmlFor="password_confirmation" className="mb-2 block text-sm font-semibold text-[#34465b]">Confirm password</label><input id="password_confirmation" name="password_confirmation" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" /></div></div><button type="submit" disabled={busy || isLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm bg-[#102746] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#17385e] disabled:opacity-55">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="h-4 w-4" /></>}</button></form>
      </section>
    </main>
  );
}
