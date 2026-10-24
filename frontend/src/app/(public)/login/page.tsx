"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function homeForRole(role?: string) {
  if (role === "teacher") return "/attendance/super-admin/dashboard";
  if (role === "academic_director" || role === "academic_administrator") return "/acadamic/super-admin/dashboard";
  if (role === "superadmin") return "/super-admin/dashboard";
  return "/member/super-admin/dashboard";
}

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace(homeForRole(user.role));
  }, [isLoading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message || "We could not sign you in. Check your details and try again.");
      setBusy(false);
      return;
    }
    router.replace(homeForRole(result.user?.role));
    router.refresh();
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[1fr_.8fr] lg:px-8">
      <section className="hidden max-w-lg lg:block">
        <div className="inline-flex items-center gap-2 border-l-2 border-[#b59660] pl-3 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#456250]"><LockKeyhole className="h-3.5 w-3.5" /> Your school community</div>
        <h1 className="mt-6 font-serif text-5xl font-semibold leading-tight tracking-tight text-[#102746]">Welcome back to your Sunday School.</h1>
        <p className="mt-5 text-base leading-8 text-[#687586]">Sign in to continue supporting the students, teachers, and families entrusted to your care.</p>
        <div className="mt-9 border-l-2 border-[#b59660] bg-[#efede6] p-5"><p className="font-serif text-xl font-semibold text-[#102746]">"Teach them to your children..."</p><p className="mt-2 text-xs font-semibold uppercase tracking-[.16em] text-[#8c7140]">Deuteronomy 6:7</p></div>
      </section>
      <section className="mx-auto w-full max-w-md border-t-2 border-[#102746] bg-[#f8f7f3] p-7 sm:p-9">
        <div className="grid h-12 w-12 place-items-center border-b border-[#b59660] text-[#244a72]"><KeyRound className="h-5 w-5" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#8c7140]">Member access</p><h2 className="mt-2 font-serif text-3xl font-semibold text-[#102746]">Sign in</h2><p className="mt-2 text-sm leading-6 text-[#78818b]">Use the account provided by your Sunday School administrator.</p>
        {error && <div role="alert" className="mt-6 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34465b]">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy || isLoading} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition placeholder:text-[#a1a8ae] focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" placeholder="you@example.com" /></div>
          <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold text-[#34465b]">Password</label><Link href="/forgot-password" className="text-xs font-bold text-[#244a72] hover:text-[#8c7140]">Forgot password?</Link></div><div className="relative"><input id="password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy || isLoading} className="w-full rounded-sm border border-[#d5d8da] bg-[#fbfaf7] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#244a72] focus:ring-4 focus:ring-[#244a72]/10" placeholder="Enter your password" /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#85909a] hover:text-[#102746]" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          <button type="submit" disabled={busy || isLoading} className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#102746] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#102746]/15 transition hover:bg-[#17385e] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Signing in...</> : <>Continue to your portal <ArrowRight className="h-4 w-4" /></>}</button>
        </form>
        <div className="mt-6 flex items-center justify-between border-t border-[#ece8df] pt-5 text-xs"><Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-[#697687] hover:text-[#102746]"><ArrowLeft className="h-3.5 w-3.5" /> Back home</Link><Link href="/register" className="font-bold text-[#244a72] hover:text-[#8c7140]">Create an account</Link></div>
        <p className="mt-5 text-center text-[11px] leading-5 text-[#9aa2aa]">Sign-in is protected by your school's account and access permissions.</p>
      </section>
    </main>
  );
}
