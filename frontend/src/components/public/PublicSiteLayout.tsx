"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/navbar/languageSwicher";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRouteForRole } from "@/utils/roleNavigation";

export function EthiopianOrthodoxCross({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 44"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central Shaft and Cross arms with Lalibela motif */}
      <path
        d="M18 2V42M6 14H30M10 24H26M13 36L18 42L23 36M13 14L18 7L23 14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Geometric ornaments */}
      <circle cx="18" cy="7" r="1.5" fill="currentColor" />
      <circle cx="6" cy="14" r="1.5" fill="currentColor" />
      <circle cx="30" cy="14" r="1.5" fill="currentColor" />
      <circle cx="18" cy="24" r="2" fill="currentColor" />
      <path
        d="M10 8L14 12M26 8L22 12M10 20L14 16M26 20L22 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const links = [
  { href: "/#sunday-school", label: "Sunday School", amharic: "ሰንበት ት/ቤት" },
  { href: "/#curriculum", label: "Curriculum", amharic: "ስርዓተ ትምህርት" },
  { href: "/#school-life", label: "Parish Life", amharic: "የቤተክርስቲያን ኅብረት" },
  { href: "/about-us", label: "Our Ministry", amharic: "ስለ አገልግሎቱ" },
  { href: "/contact-us", label: "Contact", amharic: "አድራሻ" },
];

export function PublicSiteLayout({
  children,
  hideFooter = false,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}) {
  const { user } = useAuth();
  const portalHref = user ? getDashboardRouteForRole(user.role) : "/login";
  const portalLabel = user ? "Dashboard / ዋና ገጽ" : "School Portal";
  const mobilePortalLabel = user ? "Dashboard" : "Sign In";

  return (
    <div className="min-h-screen bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] flex flex-col font-sans transition-colors duration-0">
      {!hideHeader && (
        <>
          {/* Top Banner Notice */}
          <div className="bg-[#0b1c34] dark:bg-[#060a12] text-[#e8d5a8] dark:text-[#fba81c] text-[11px] py-1.5 px-4 text-center border-b border-[#c5a866]/30 dark:border-slate-800 flex items-center justify-center gap-2 font-medium">
            <span>✝ የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን የሰንበት ትምህርት ቤት አስተዳደር መድረክ</span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/80 dark:text-slate-300">Ethiopian Orthodox Tewahedo Church Sunday School Platform</span>
          </div>

          {/* Main Header */}
          <header className="sticky top-0 z-40 border-b border-[#e5dcc8] dark:border-slate-800 bg-[#fdfbf6]/95 dark:bg-[#0e1424]/95 backdrop-blur-md shadow-xs">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
              <Link href="/" className="flex items-center gap-3 group" aria-label="Simple Senbet Home">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#c5a866] dark:border-[#fba81c]/40 bg-[#f5ecda] dark:bg-[#141a29] text-[#7d612e] dark:text-[#fba81c] shadow-xs transition-transform group-hover:scale-105">
                  <EthiopianOrthodoxCross className="h-7 w-7 text-[#8c7140] dark:text-[#fba81c]" />
                </span>
                <span>
                  <span className="block font-serif text-[18px] font-bold leading-tight tracking-tight text-[#0f243e] dark:text-slate-100">
                    Simple Senbet
                  </span>
                  <span className="block text-[10px] font-medium tracking-[0.08em] text-[#8c7140] dark:text-[#fba81c]">
                    ሰንበት ትምህርት ቤት | Orthodox Sunday School
                  </span>
                </span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden items-center gap-5 text-[13px] font-medium text-[#4c5e70] dark:text-slate-300 md:flex" aria-label="Main navigation">
                {links.map(({ href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className="transition-colors hover:text-[#8c7140] dark:hover:text-[#fba81c] hover:underline underline-offset-4 decoration-[#c5a866]"
                  >
                    {label}
                  </Link>
                ))}

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Instant Theme Toggle (Light / Dark mode from Senbet System) */}
                <ThemeToggle />

                <Link
                  href={portalHref}
                  prefetch={true}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f243e] dark:bg-[#fba81c] px-4 py-2.5 text-xs font-semibold text-white dark:text-slate-950 shadow-xs shadow-[#0f243e]/20 hover:bg-[#1a385f] dark:hover:bg-[#f59e0b] hover:shadow-md transition-all cursor-pointer"
                >
                  <span>{portalLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#dfc896] dark:text-slate-900" />
                </Link>
              </nav>

              {/* Mobile Portal CTA & Toggles */}
              <div className="flex items-center gap-2 md:hidden">
                <LanguageSwitcher />
                <ThemeToggle />
                <Link
                  href={portalHref}
                  prefetch={true}
                  className="rounded-lg bg-[#0f243e] dark:bg-[#fba81c] px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{mobilePortalLabel}</span>
                  <ArrowUpRight className="h-3 w-3 text-[#dfc896] dark:text-slate-900" />
                </Link>
              </div>
            </div>

            {/* Mobile Horizontal Sub-nav */}
            <nav
              className="flex gap-4 overflow-x-auto border-t border-[#f0ebd9] dark:border-slate-800/80 px-5 py-2 text-[12px] font-medium text-[#5e7081] dark:text-slate-400 md:hidden scrollbar-none bg-[#fdfbf6] dark:bg-[#0e1424]"
              aria-label="Mobile navigation"
            >
              {links.map(({ href, label }) => (
                <Link key={label} href={href} className="shrink-0 hover:text-[#8c7140] dark:hover:text-[#fba81c] whitespace-nowrap">
                  {label}
                </Link>
              ))}
            </nav>
          </header>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1">{children}</div>

      {/* Footer */}
      {!hideFooter && (
        <footer className="border-t border-[#e2d8c3] dark:border-slate-800 bg-[#f3ede1] dark:bg-[#0e1424] text-[#2c3e50] dark:text-slate-200">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Identity */}
              <div className="space-y-4">
                <Link href="/" className="inline-flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#c5a866] dark:border-[#fba81c]/40 bg-[#f7f2e6] dark:bg-[#141a29] text-[#7d612e] dark:text-[#fba81c]">
                    <EthiopianOrthodoxCross className="h-6 w-6 text-[#8c7140] dark:text-[#fba81c]" />
                  </span>
                  <span className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100">Simple Senbet</span>
                </Link>
                <p className="text-xs leading-relaxed text-[#596a79] dark:text-slate-400">
                  Dedicated to nurturing Christian faith, Orthodox dogmatics, liturgical Yaredic chant, and youth service in the Ethiopian Orthodox Tewahedo Church.
                </p>
                <div className="pt-2 text-[11px] font-medium text-[#7d6738] dark:text-[#fba81c] flex items-center gap-1.5">
                  <span>✝</span>
                  <span>«ሕፃናትን ወደ እኔ ይመጡ ዘንድ ተዉአቸው» (ማቴ ፲፱፥፲፬)</span>
                </div>
              </div>

              {/* Sunday School Sections */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d6738] dark:text-[#fba81c]">
                  ትምህርተ ቤተ ክርስቲያን
                </p>
                <ul className="mt-3 space-y-2 text-xs text-[#526475] dark:text-slate-400">
                  <li><Link href="/#sunday-school" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">ቅዱሳት መጻሕፍት (Scripture)</Link></li>
                  <li><Link href="/#curriculum" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">ዜማና ሥርዓተ ማኅሌት (Zema & Liturgy)</Link></li>
                  <li><Link href="/#curriculum" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">ትምህርተ ሃይማኖት (Church Dogma)</Link></li>
                  <li><Link href="/#school-life" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">ታሪከ ቤተ ክርስቲያን (Church History)</Link></li>
                </ul>
              </div>

              {/* Portals & Roles */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d6738] dark:text-[#fba81c]">
                  የአገልግሎት ክፍሎች
                </p>
                <ul className="mt-3 space-y-2 text-xs text-[#526475] dark:text-slate-400">
                  <li><Link href={portalHref} className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">የትምህርት ክፍል (Academics)</Link></li>
                  <li><Link href={portalHref} className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">የፋይናንስ ክፍል (Finance & Contributions)</Link></li>
                  <li><Link href={portalHref} className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">የቁጥጥርና ክትትል (Attendance)</Link></li>
                  <li><Link href={portalHref} className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">የአባላትና ምዝገባ (Member Coordination)</Link></li>
                </ul>
              </div>

              {/* Quick Links & Contact */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d6738] dark:text-[#fba81c]">
                  ድጋፍና አድራሻ
                </p>
                <ul className="mt-3 space-y-2 text-xs text-[#526475] dark:text-slate-400">
                  <li><Link href="/contact-us" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">Contact School Office</Link></li>
                  <li><Link href="/about-us" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">About the Platform</Link></li>
                  <li><Link href="/forgot-password" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">Password Reset</Link></li>
                  <li><Link href={portalHref} className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition font-semibold text-[#0f243e] dark:text-[#fba81c]">{user ? "Open Dashboard" : "Sign In to Portal"}</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-10 pt-6 border-t border-[#dfd4be] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#718292] dark:text-slate-400">
              <p>(c) {new Date().getFullYear()} Simple Senbet | Ethiopian Orthodox Tewahedo Sunday School System.</p>
              <div className="flex gap-4">
                <Link href="/privacy-policy" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">Privacy Policy</Link>
                <Link href="/terms-of-service" className="hover:text-[#8c7140] dark:hover:text-[#fba81c] transition">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
