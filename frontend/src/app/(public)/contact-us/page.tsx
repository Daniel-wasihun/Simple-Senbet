"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin } from "lucide-react";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";
import { useTranslation } from "@/hooks/useTranslation";

export default function ContactPage() {
  const { t } = useTranslation();
  const c = (key: string) => t(`public.contact.${key}`);
  const [sent, setSent] = useState(false);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@simplesenbet.org";
  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#132438] outline-none transition placeholder:text-slate-400 focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 dark:border-slate-700 dark:bg-[#1c2438] dark:text-slate-100";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Simple Senbet inquiry: ${String(data.get("name"))} - ${String(data.get("topic"))}`);
    const body = encodeURIComponent(`From: ${String(data.get("name"))}\nEmail: ${String(data.get("email"))}\nParish / Role: ${String(data.get("parish"))}\nTopic: ${String(data.get("topic"))}\n\n${String(data.get("message"))}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return <main className="bg-white text-[#132438] dark:bg-[#0a0e1a] dark:text-slate-100">
    <section className="relative overflow-hidden border-b border-[#2563EB]/40 bg-white px-5 py-16 text-slate-900 dark:text-white dark:bg-slate-950 lg:px-8"><div className="pointer-events-none absolute inset-0 opacity-[.12]" style={{backgroundImage:"radial-gradient(#2563EB 1px, transparent 1px)",backgroundSize:"28px 28px"}}/><div className="relative mx-auto max-w-5xl space-y-4 text-center"><span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/60 bg-[#2563EB]/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300"><EthiopianOrthodoxCross className="h-4 w-4"/>{c("eyebrow")}</span><h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{c("title")}</h1><p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">{c("intro")}</p></div></section>
    <section className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-14 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
      <aside className="space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#141a29]"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB] dark:text-[#93c5fd]">{c("parish")}</p><h2 className="mt-1 font-serif text-xl font-bold text-[#1D4ED8] dark:text-slate-100">{c("enrollment")}</h2><p className="mt-2 text-xs leading-6 text-[#5f7081] dark:text-slate-400">{c("enrollmentCopy")}</p></div><div className="mt-5 border-t border-[#ebd8b7] pt-4 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB] dark:text-[#93c5fd]">{c("support")}</p><h2 className="mt-1 font-serif text-xl font-bold text-[#1D4ED8] dark:text-slate-100">{c("account")}</h2><p className="mt-2 text-xs leading-6 text-[#5f7081] dark:text-slate-400">{c("accountCopy")}</p><Link href="/forgot-password" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#93c5fd]">{c("reset")}<ArrowRight className="h-3.5 w-3.5"/></Link></div><div className="mt-5 space-y-3 border-t border-[#ebd8b7] pt-4 text-xs text-[#526475] dark:border-slate-800 dark:text-slate-400"><a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-[#2563EB]"><Mail className="h-4 w-4 text-[#2563EB] dark:text-[#93c5fd]"/>{contactEmail}</a><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#2563EB] dark:text-[#93c5fd]"/>{c("serving")}</p></div></div></aside>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#141a29] sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2563EB] dark:text-[#93c5fd]">{c("sendNote")}</p><h2 className="mt-1 font-serif text-2xl font-bold text-[#1D4ED8] dark:text-slate-100">{c("formTitle")}</h2><p className="mt-2 text-xs leading-6 text-[#667788] dark:text-slate-400">{c("formCopy")}</p>
        {sent && <div role="status" className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4"/>{c("emailReady")}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">{c("name")}</label><input id="name" name="name" required className={inputClass} placeholder={c("name")}/></div><div><label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">{c("email")}</label><input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com"/></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="parish" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">{c("parish")}</label><input id="parish" name="parish" className={inputClass} placeholder={c("parishPlaceholder")}/></div><div><label htmlFor="topic" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">{c("topic")}</label><select id="topic" name="topic" className={inputClass}><option>{c("topicSchool")}</option><option>{c("topicAccess")}</option><option>{c("topicTechnical")}</option><option>{c("topicOther")}</option></select></div></div>
          <div><label htmlFor="message" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">{c("message")}</label><textarea id="message" name="message" rows={4} required className={`${inputClass} resize-y`} placeholder={c("messagePlaceholder")}/></div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB] dark:bg-[#2563EB] dark:text-white dark:hover:bg-[#315c86]">{c("prepare")}<ArrowRight className="h-4 w-4"/></button>
        </form>
      </section>
    </section>
  </main>;
}
