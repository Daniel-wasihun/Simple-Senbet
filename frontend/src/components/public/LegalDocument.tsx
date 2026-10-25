"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type LegalDocumentName = "privacy" | "terms";

const sectionKeys: Record<LegalDocumentName, [string, string][]> = {
  privacy: [
    ["collectedTitle", "collectedBody"],
    ["useTitle", "useBody"],
    ["accessTitle", "accessBody"],
  ],
  terms: [
    ["credentialsTitle", "credentialsBody"],
    ["recordsTitle", "recordsBody"],
    ["stewardshipTitle", "stewardshipBody"],
  ],
};

export function LegalDocument({ document }: { document: LegalDocumentName }) {
  const { t } = useTranslation();
  const copy = (key: string) => t(`public.legal.${document}.${key}`);

  return (
    <main className="min-h-[calc(100vh-12rem)] bg-white px-5 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-4xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{copy("eyebrow")}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{copy("title")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{copy("subtitle")}</p>
        </header>

        <div className="space-y-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>{copy("intro")}</p>
          {sectionKeys[document].map(([title, body]) => <section key={title} aria-labelledby={title}>
            <h2 id={title} className="font-serif text-lg font-semibold text-slate-900 dark:text-white">{copy(title)}</h2>
            <p className="mt-2">{copy(body)}</p>
          </section>)}
        </div>

        <footer className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-200">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t("public.auth.backHome")}
          </Link>
        </footer>
      </article>
    </main>
  );
}
