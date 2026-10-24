"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactEmail) return;
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Simple Senbet enquiry from ${String(data.get("name"))}`);
    const body = encodeURIComponent(`From: ${String(data.get("name"))}\nEmail: ${String(data.get("email"))}\nTopic: ${String(data.get("topic"))}\n\n${String(data.get("message"))}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const field = "w-full border border-[#d5d8da] bg-[#fbfaf7] px-3.5 py-3 text-sm outline-none focus:border-[#244a72] focus:ring-2 focus:ring-[#244a72]/10";

  return <main>
    <section className="bg-[#142b47] text-white"><div className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#d2b77f]">Contact us</p><h1 className="mt-4 max-w-3xl font-serif text-5xl font-medium leading-tight sm:text-6xl">We're here to help.</h1><p className="mt-5 max-w-2xl text-[15px] leading-8 text-white/70">For questions about the portal or supporting your parish Sunday School, send us a note or contact your local school office.</p></div><div className="h-1 bg-[#a88a56]" /></section>
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:py-16 lg:grid-cols-[.7fr_1.3fr] lg:gap-20 lg:px-8">
      <aside className="space-y-8">
        <div className="border-t border-[#d9d4c9] pt-5"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8c7140]">Your local parish</p><h2 className="mt-2 font-serif text-xl font-semibold text-[#172b42]">Enrollment and school life</h2><p className="mt-2 text-sm leading-7 text-[#687586]">For enrollment, class schedules, and student accounts, your parish Sunday School office is the best place to start.</p></div>
        <div className="border-t border-[#d9d4c9] pt-5"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8c7140]">Portal support</p><h2 className="mt-2 font-serif text-xl font-semibold text-[#172b42]">Account access</h2><p className="mt-2 text-sm leading-7 text-[#687586]">If you already have an account, contact your school administrator for access or password help.</p><Link href="/forgot-password" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#244a72] hover:text-[#8c7140]">Reset your password <ArrowRight className="h-4 w-4" /></Link></div>
        {contactEmail && <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 break-all text-sm font-semibold text-[#244a72] hover:underline"><Mail className="h-4 w-4 shrink-0" />{contactEmail}</a>}
        <p className="flex items-center gap-2 text-xs text-[#858b90]"><MapPin className="h-3.5 w-3.5" /> Serving parish Sunday Schools</p>
      </aside>
      <div className="border-t-2 border-[#102746] pt-6"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8c7140]">Send a note</p><h2 className="mt-2 font-serif text-3xl font-medium text-[#172b42]">How can we help?</h2><p className="mt-2 text-sm leading-6 text-[#78818b]">Share your question and we'll help you connect with the right person.</p>
        {!contactEmail && <div className="mt-6 border-l-2 border-[#b59660] bg-[#f0eee8] px-4 py-3 text-sm leading-6 text-[#5f5c53]">The school contact email has not been configured yet. Please contact your local parish office for assistance.</div>}
        {sent && <div role="status" className="mt-5 flex items-center gap-2 border-l-2 border-[#52705c] bg-[#edf2ed] px-4 py-3 text-sm font-medium text-[#315348]"><Check className="h-4 w-4" /> Your email application is ready with your message.</div>}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="name" className="mb-2 block text-sm font-medium text-[#34465b]">Your name</label><input id="name" name="name" required className={field} placeholder="Name" /></div><div><label htmlFor="email" className="mb-2 block text-sm font-medium text-[#34465b]">Email address</label><input id="email" name="email" type="email" required className={field} placeholder="you@example.com" /></div></div><div><label htmlFor="topic" className="mb-2 block text-sm font-medium text-[#34465b]">I'm contacting about</label><select id="topic" name="topic" className={field}><option>Sunday School information</option><option>Portal access</option><option>Technical support</option><option>Something else</option></select></div><div><label htmlFor="message" className="mb-2 block text-sm font-medium text-[#34465b]">Your message</label><textarea id="message" name="message" rows={5} required className={`${field} resize-y`} placeholder="Tell us how we can help..." /></div><button type="submit" disabled={!contactEmail} className="inline-flex items-center gap-2 bg-[#102746] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244a72] disabled:cursor-not-allowed disabled:opacity-50">Prepare message <ArrowRight className="h-4 w-4" /></button></form>
      </div>
    </section>
  </main>;
}
