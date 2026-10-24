"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@simplesenbet.org";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Simple Senbet Inquiry: ${String(data.get("name"))} - ${String(data.get("topic"))}`);
    const body = encodeURIComponent(
      `From: ${String(data.get("name"))}\nEmail: ${String(data.get("email"))}\nParish / Role: ${String(data.get("parish"))}\nTopic: ${String(data.get("topic"))}\n\nMessage:\n${String(data.get("message"))}`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const inputClass =
    "w-full rounded-xl border border-[#d2d8dc] bg-[#fdfbf7] px-4 py-2.5 text-sm outline-none transition focus:border-[#0f243e] focus:ring-4 focus:ring-[#0f243e]/10";

  return (
    <main className="bg-[#fcfaf5]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a192e] text-[#fbf6ec] py-16 px-5 lg:px-8 border-b border-[#c5a866]/40">
        <div className="relative mx-auto max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a866]/60 bg-[#c5a866]/15 px-4 py-1.5 text-xs font-semibold text-[#f5e6c2]">
            <span>✝</span>
            <span>ያግኙን | Parish & Technical Support</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#fdfbf6]">
            We're Here to Support Your Ministry.
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base leading-7 text-[#d2dbe5]">
            Have inquiries regarding Sunday School setup, account credentials, or departmental training?
            Reach out to our team or connect with your parish administrator.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-start">
          {/* Left info */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#d8ccb4] bg-[#fbf9f4] p-6 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7140]">
                  የደብርዎ አስተዳደር
                </span>
                <h3 className="font-serif text-xl font-bold text-[#0f243e] mt-1">
                  Local Parish Sunday School Office
                </h3>
                <p className="text-xs sm:text-sm leading-6 text-[#5f7081] mt-2">
                  For baptism certificates, class registrations, student enrollment, and teacher assignments,
                  your local parish Sunday School secretariat is the primary contact.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ebd8b7]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7140]">
                  የመግቢያና የመለያ ድጋፍ
                </span>
                <h3 className="font-serif text-xl font-bold text-[#0f243e] mt-1">
                  Account & Portal Inquiries
                </h3>
                <p className="text-xs sm:text-sm leading-6 text-[#5f7081] mt-2">
                  If you already hold an authorized account and require a password reset, you can proceed directly
                  via our self-service recovery:
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#8c7140] hover:text-[#0f243e] transition"
                >
                  <span>Reset account password</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="pt-4 border-t border-[#ebd8b7] space-y-2 text-xs text-[#526475]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#8c7140]" />
                  <span>{contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#8c7140]" />
                  <span>Ethiopian Orthodox Tewahedo Church Parishes</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Message Form */}
          <div className="rounded-2xl border border-[#d8ccb4] bg-white p-7 sm:p-9 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c7140]">
              መልእክት ይላኩልን
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0f243e] mt-1">
              Send a Note to Support
            </h2>
            <p className="text-xs sm:text-sm text-[#667788] mt-1">
              Submit your inquiry and our support team will follow up promptly.
            </p>

            {sent && (
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Your email application has been prepared with your message!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
                    Full Name / ሙሉ ስም
                  </label>
                  <input id="name" name="name" required className={inputClass} placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
                    Email Address / ኢሜይል
                  </label>
                  <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="parish" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
                    Parish / ደብር
                  </label>
                  <input id="parish" name="parish" className={inputClass} placeholder="e.g. Debre Mitmaq St. Mary" />
                </div>
                <div>
                  <label htmlFor="topic" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
                    Topic / ጉዳይ
                  </label>
                  <select id="topic" name="topic" className={inputClass}>
                    <option>Sunday School Portal Access</option>
                    <option>Academic & Attendance Setup</option>
                    <option>Finance Department Configuration</option>
                    <option>General Ministry Information</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
                  Message / መልእክት
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className={`${inputClass} resize-y`}
                  placeholder="Describe your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f243e] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1a385f] transition-all"
              >
                <span>Send Inquiry</span>
                <ArrowRight className="h-4 w-4 text-[#dfc896]" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
