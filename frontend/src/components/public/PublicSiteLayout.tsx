import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function OrthodoxCross({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 32 40" fill="none" className={className}><path d="M16 2v34M7 11h18M10 19h12M10 30l6 5 6-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 30l6 5 6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

const links = [
  { href: "/#sunday-school", label: "Sunday School" },
  { href: "/#school-life", label: "School life" },
  { href: "/about-us", label: "Our ministry" },
  { href: "/contact-us", label: "Contact" },
];

export function PublicSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f5ed] text-[#172b42]">
      <header className="sticky top-0 z-40 border-b border-[#e5dcc8] bg-[#fbf9f3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Simple Senbet home">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#b29356] bg-[#f2ead8] p-2 text-[#775a2e]"><OrthodoxCross className="h-7 w-6" /></span>
            <span><span className="block font-serif text-[16px] font-semibold leading-tight tracking-wide text-[#102746]">Simple Senbet</span><span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.12em] text-[#806d4d]">Orthodox Sunday School | Sunday School</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-[12px] font-medium text-[#596a78] md:flex" aria-label="Main navigation">
            {links.map(({ href, label }) => <Link key={label} href={href} className="transition hover:text-[#806943]">{label}</Link>)}
            <Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-[#102746] px-4 py-2.5 font-semibold text-white transition hover:bg-[#285848]">School portal <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </nav>
          <Link href="/login" className="rounded-md bg-[#102746] px-3.5 py-2 text-xs font-semibold text-white md:hidden">Portal sign in</Link>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-[#efe9dc] px-5 py-2.5 text-[11px] font-medium text-[#647582] md:hidden" aria-label="Mobile navigation">
          {links.map(({ href, label }) => <Link key={label} href={href} className="shrink-0 hover:text-[#806943]">{label}</Link>)}
        </nav>
      </header>
      {children}
      <footer className="border-t border-[#e5dcc8] bg-[#eee8da]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:grid-cols-[1.3fr_.7fr_.7fr] lg:px-8">
          <div><Link href="/" className="inline-flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#b29356] bg-[#f7f2e7] p-2 text-[#775a2e]"><OrthodoxCross className="h-6 w-5" /></span><span className="font-serif font-semibold text-[#102746]">Simple Senbet</span></Link><p className="mt-3 max-w-sm text-xs leading-6 text-[#6f756e]">A shared space for the teaching, worship, and care of Ethiopian Orthodox Sunday School communities.</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#87938f]">Parish life</p><div className="mt-3 flex flex-col items-start gap-2.5 text-xs text-[#536573]"><Link href="/#sunday-school" className="hover:text-[#806943]">Sunday School</Link><Link href="/#school-life" className="hover:text-[#806943]">School life</Link><Link href="/about-us" className="hover:text-[#806943]">Our ministry</Link></div></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#87938f]">Get support</p><div className="mt-3 flex flex-col items-start gap-2.5 text-xs text-[#536573]"><Link href="/contact-us" className="hover:text-[#806943]">Contact us</Link><Link href="/forgot-password" className="hover:text-[#806943]">Reset password</Link><Link href="/login" className="hover:text-[#806943]">School portal</Link></div></div>
          <div className="flex gap-4 border-t border-[#dfe6e3] pt-4 text-[10px] text-[#89948f] sm:col-span-3"><Link href="/privacy-policy" className="hover:text-[#806943]">Privacy</Link><Link href="/terms-of-service" className="hover:text-[#806943]">Terms</Link></div>
          <p className="text-[10px] text-[#89948f] sm:col-span-3">(c) {new Date().getFullYear()} Simple Senbet | Built to support parish Sunday Schools.</p>
        </div>
      </footer>
    </div>
  );
}
