"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/navbar/languageSwicher";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getDashboardRouteForRole } from "@/utils/roleNavigation";

export function EthiopianOrthodoxCross({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 44" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2V42M6 14H30M10 24H26M13 36L18 42L23 36M13 14L18 7L23 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="7" r="1.5" fill="currentColor" /><circle cx="6" cy="14" r="1.5" fill="currentColor" /><circle cx="30" cy="14" r="1.5" fill="currentColor" /><circle cx="18" cy="24" r="2" fill="currentColor" />
      <path d="M10 8L14 12M26 8L22 12M10 20L14 16M26 20L22 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const navigation = [
  { href: "/#curriculum", key: "church.navigation.curriculum" },
  { href: "/#sunday-school", key: "church.navigation.parishLife" },
  { href: "/about-us", key: "church.navigation.ministry" },
  { href: "/contact-us", key: "church.navigation.contact" },
];

export function PublicSiteLayout({ children, hideFooter = false, hideHeader = false }: {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const portalHref = user ? getDashboardRouteForRole(user.role, user.permissions) : "/login";
  const portalLabel = t(user ? "church.navigation.dashboard" : "church.navigation.portal");

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), select:not([disabled])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("button, select, a[href]")?.focus());
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {!hideHeader && <header className="relative z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950" aria-label="Simple Senbet home">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-[#1D4ED8] dark:border-slate-700 dark:bg-slate-900 dark:text-blue-200"><EthiopianOrthodoxCross className="h-7 w-7" /></span>
            <span><span className="block font-serif text-lg font-semibold leading-tight tracking-tight text-[#1D4ED8] dark:text-white">Simple Senbet</span><span className="mt-0.5 block text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400">{t("church.layout.tagline")}</span></span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-600 dark:text-slate-300 lg:flex" aria-label={t("navigation.main")}>
            {navigation.map(({ href, key }) => <Link key={key} href={href} className="rounded-sm transition-colors hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:hover:text-blue-200">{t(key)}</Link>)}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href={portalHref} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1D4ED8] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 dark:bg-[#2563EB] dark:text-white dark:hover:bg-[#315c86] dark:focus-visible:ring-offset-slate-950">
              {portalLabel}<ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-center lg:hidden">
          <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="public-mobile-navigation" aria-label={menuOpen ? t("navigation.closeMenu") : t("navigation.openMenu")} className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-[#1D4ED8] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:border-slate-700 dark:text-white dark:hover:bg-slate-900">
              {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>

      </header>}

      {menuOpen && <>
        <button type="button" aria-label={t("navigation.closeMenu")} onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden" />
        <div ref={drawerRef} role="dialog" aria-modal="true" aria-label={t("navigation.main")} className="fixed inset-y-0 right-0 z-50 w-[min(88vw,22rem)] overflow-y-auto border-l border-slate-200 bg-white px-5 py-5 shadow-xl dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800"><span className="font-serif text-base font-semibold text-blue-800 dark:text-blue-200">{t("navigation.main")}</span><button type="button" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} aria-label={t("navigation.closeMenu")} className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:text-slate-200"><X aria-hidden="true" className="h-5 w-5" /></button></div>
          <div className="mb-4 flex items-center justify-between px-2"><LanguageSwitcher /><ThemeToggle /></div>
          <nav id="public-mobile-navigation" className="grid gap-1" aria-label={t("navigation.main")}>
            {navigation.map(({ href, key }) => <Link key={key} href={href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-200 dark:hover:bg-slate-900">{t(key)}</Link>)}
            <Link href={portalHref} onClick={() => setMenuOpen(false)} className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-[#2563EB] dark:text-white">
              {portalLabel}<ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </>}

      <div className="flex-1">{children}</div>

      {!hideFooter && <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-3"><Link href="/" className="inline-flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-[#1D4ED8] dark:border-slate-700 dark:text-blue-200"><EthiopianOrthodoxCross className="h-6 w-6" /></span><span className="font-serif text-lg font-semibold text-[#1D4ED8] dark:text-white">Simple Senbet</span></Link><p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">{t("church.layout.footerDescription")}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("church.layout.quickLinks")}</p><ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300"><li><Link href="/about-us" className="hover:text-[#1D4ED8] dark:hover:text-blue-200">{t("church.layout.about")}</Link></li><li><Link href="/contact-us" className="hover:text-[#1D4ED8] dark:hover:text-blue-200">{t("church.layout.schoolOffice")}</Link></li><li><Link href="/forgot-password" className="hover:text-[#1D4ED8] dark:hover:text-blue-200">{t("church.layout.resetPassword")}</Link></li></ul></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("navigation.legal")}</p><ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300"><li><Link href="/privacy-policy" className="hover:text-[#1D4ED8] dark:hover:text-blue-200">{t("footer.privacy")}</Link></li><li><Link href="/terms-of-service" className="hover:text-[#1D4ED8] dark:hover:text-blue-200">{t("footer.terms")}</Link></li></ul></div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><p>© {new Date().getFullYear()} Simple Senbet · {t("church.layout.copyright")}</p><p className="mt-2">Photo: MarcD., <Link href="https://commons.wikimedia.org/wiki/File:Debre_Libanos_Monastery,_Ethiopia_-_panoramio.jpg" target="_blank" rel="noreferrer" className=" hover:text-[#1D4ED8] dark:hover:text-blue-200">Debre Libanos Monastery</Link>, licensed under <Link href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="license noreferrer" className=" hover:text-[#1D4ED8] dark:hover:text-blue-200">CC BY-SA 3.0</Link>.</p><p className="mt-2 max-w-4xl leading-5">{t("church.layout.photoCredits")}</p><p className="mt-2 max-w-4xl leading-5">Church and service photos: <Link href="https://commons.wikimedia.org/wiki/File:Lalibela,_san_giorgio,_esterno_24.jpg" target="_blank" rel="noreferrer" className="hover:text-blue-700">Biete Ghiorgis by Sailko</Link> (<Link href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="license noreferrer" className="hover:text-blue-700">CC BY 3.0</Link>); <Link href="https://commons.wikimedia.org/wiki/File:Ethiopian_Orthodox_church_in_Addis_Abeba.jpg" target="_blank" rel="noreferrer" className="hover:text-blue-700">Addis Ababa church by VBzi</Link> (<Link href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="license noreferrer" className="hover:text-blue-700">CC BY 2.0</Link>); <Link href="https://commons.wikimedia.org/wiki/File:Ethio-orthodox-priests.jpg" target="_blank" rel="noreferrer" className="hover:text-blue-700">service photo by Gyrofrog</Link> (<Link href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="license noreferrer" className="hover:text-blue-700">CC BY-SA 3.0</Link>); and <Link href="https://commons.wikimedia.org/wiki/File:Jewel_Tones_in_the_Church_of_Bet_Abba_Libanos_(3343044262).jpg" target="_blank" rel="noreferrer" className="hover:text-blue-700">processional crosses by A. Davey</Link> (<Link href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="license noreferrer" className="hover:text-blue-700">CC BY 2.0</Link>).</p></div>
        </div>
      </footer>}
    </div>
  );
}
