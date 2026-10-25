"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, HeartHandshake, UsersRound } from "lucide-react";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";
import { useTranslation } from "@/hooks/useTranslation";

const valueIcons = [BookOpenCheck, UsersRound, HeartHandshake];

export default function AboutPage() {
  const { t } = useTranslation();
  const about = (key: string) => t(`public.about.${key}`);
  const values = [
    { title: about("value1Title"), copy: about("value1Copy") },
    { title: about("value2Title"), copy: about("value2Copy") },
    { title: about("value3Title"), copy: about("value3Copy") },
  ];
  const steps = [
    { title: about("organize"), copy: about("organizeCopy") },
    { title: about("coordinate"), copy: about("coordinateCopy") },
    { title: about("grow"), copy: about("growCopy") },
  ];

  return <main className="bg-white text-[#132438] dark:bg-[#0a0e1a] dark:text-slate-100">
    <section className="relative overflow-hidden border-b border-[#2563EB]/40 bg-white px-5 py-16 text-slate-900 dark:text-white dark:bg-slate-950 sm:py-20 lg:px-8"><div className="pointer-events-none absolute inset-0 opacity-[.12]" style={{backgroundImage:"radial-gradient(#2563EB 1px, transparent 1px)",backgroundSize:"28px 28px"}}/><div className="relative mx-auto max-w-5xl space-y-5 text-center"><span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/60 bg-[#2563EB]/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300"><EthiopianOrthodoxCross className="h-4 w-4"/>{about("eyebrow")}</span><h1 className="mx-auto max-w-4xl font-serif text-4xl font-medium leading-tight tracking-tight sm:text-6xl">{about("title")}</h1><p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">{about("intro")}</p></div></section>
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2563EB] dark:text-[#93c5fd]">{about("why")}</p><h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#1D4ED8] dark:text-slate-100 sm:text-4xl">{about("missionTitle")}</h2></div><div className="space-y-4 text-sm leading-7 text-[#5e7081] dark:text-slate-400 sm:text-base"><p>{about("p1")}</p><p>{about("p2")}</p><p>{about("p3")}</p></div></section>
    <section className="border-y border-[#e5e7eb] bg-white px-5 py-16 dark:border-slate-800 dark:bg-[#0e1424] lg:px-8"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2563EB] dark:text-[#93c5fd]">{about("guide")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-[#1D4ED8] dark:text-slate-100 sm:text-4xl">{about("valuesTitle")}</h2><p className="mt-3 text-sm leading-6 text-[#71808a] dark:text-slate-400">{about("valuesIntro")}</p></div><div className="mt-9 grid gap-4 md:grid-cols-3">{values.map((value,index)=>{const Icon=valueIcons[index];return <article key={value.title} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#141a29]"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eff6ff] text-[#2563EB] dark:bg-[#1c2438] dark:text-[#93c5fd]"><Icon className="h-5 w-5"/></span><h3 className="mt-4 font-serif text-lg font-bold text-[#1D4ED8] dark:text-slate-100">{value.title}</h3><p className="mt-2 text-xs leading-6 text-[#5b6e80] dark:text-slate-400">{value.copy}</p></article>;})}</div></div></section>
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[.75fr_1.25fr] lg:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2563EB] dark:text-[#93c5fd]">{about("approach")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-[#1D4ED8] dark:text-slate-100">{about("approachTitle")}</h2></div><div className="grid gap-5 sm:grid-cols-3">{steps.map((step,index)=><article key={step.title} className="border-t border-[#2563EB] pt-4"><p className="text-[10px] font-bold tracking-[.15em] text-[#2563EB] dark:text-[#93c5fd]">0{index+1}</p><h3 className="mt-2 text-sm font-bold text-[#2d465e] dark:text-slate-200">{step.title}</h3><p className="mt-2 text-xs leading-6 text-[#71808a] dark:text-slate-400">{step.copy}</p></article>)}</div></section>
    <section className="bg-white px-5 py-11 text-white dark:bg-slate-950 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#dbeafe] dark:text-[#93c5fd]">{about("ctaLabel")}</p><h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{about("ctaTitle")}</h2></div><Link href="/contact-us" className="inline-flex items-center gap-2 self-start rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-bold text-[#0a192e] transition hover:bg-blue-800 sm:self-auto">{t("church.navigation.contact")}<ArrowRight className="h-4 w-4"/></Link></div></section>
  </main>;
}
