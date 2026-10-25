import Link from "next/link";
import { ArrowRight, BookOpenCheck, HeartHandshake, UsersRound } from "lucide-react";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";

const commitments = [
  {
    number: "፩",
    icon: BookOpenCheck,
    title: "Faith & Sacred Tradition",
    amharicTitle: "እምነትና ትውፊት",
    copy: "Nurturing deep knowledge of the Holy Scriptures, Orthodox theology, and the timeless hymns of Saint Yared for children and youth.",
  },
  {
    number: "፪",
    icon: UsersRound,
    title: "Care for Every Learner",
    amharicTitle: "የተማሪዎች እንክብካቤ",
    copy: "Equipping teachers and parish priests with accurate attendance records, spiritual milestones, and developmental insights for every student.",
  },
  {
    number: "፫",
    icon: HeartHandshake,
    title: "Service in Community",
    amharicTitle: "ማኅበራዊ አገልግሎት",
    copy: "Encouraging selfless diaconal service, unity among Sunday School alumni, and strong integration with the local parish council.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a192e] dark:bg-[#070b14] text-[#fbf6ec] py-20 px-5 lg:px-8 border-b border-[#c5a866]/40 dark:border-slate-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(#d4af37 1px, transparent 1px), radial-gradient(#d4af37 1px, #0a192e 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a866]/60 dark:border-[#fba81c]/30 bg-[#c5a866]/15 dark:bg-[#fba81c]/10 px-4 py-1.5 text-xs font-semibold text-[#f5e6c2] dark:text-[#fba81c]">
            <span>✝</span>
            <span>የሰንበት ትምህርት ቤት አገልግሎትና ራእይ | Our Mission & Ministry</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-[#fdfbf6] leading-tight">
            Technology in Sacred Service of Sunday School.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg leading-8 text-[#d2dbe5] dark:text-slate-300">
            Simple Senbet was conceived to assist the Ethiopian Orthodox Tewahedo Church in nurturing,
            organizing, and safeguarding the spiritual education of children and young adults.
          </p>
        </div>
      </section>

      {/* Purpose Story */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5 text-left">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c7140] dark:text-[#fba81c]">
              የመድረኩ ዓላማ (Why Simple Senbet)
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0f243e] dark:text-slate-100 leading-snug">
              Preserving Spiritual Heritage with Order and Dedication.
            </h2>
            <div className="space-y-4 text-sm sm:text-base leading-7 text-[#5e7081] dark:text-slate-400">
              <p>
                In the Ethiopian Orthodox Tewahedo Church, the Sunday School (ሰንበት ት/ቤት) is the vital
                heartbeat of spiritual growth. It is where young generations learn the mysteries of faith,
                sing the praises of God according to St. Yared, and grow into virtuous servants of the Church.
              </p>
              <p>
                Behind each vibrant classroom is essential administrative stewardship: enrolling students,
                coordinating volunteer teachers, tracking attendance at weekly Divine Liturgy, recording grades,
                and transparently reporting parish dues.
              </p>
              <p>
                Simple Senbet provides a dedicated, role-protected workspace tailored precisely to these sacred
                responsibilities, freeing teachers and clergy to focus on spiritual guidance.
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#141a29] p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-[#ebd8b7] dark:border-slate-800 pb-4 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f243e] dark:bg-[#1c2438] text-[#dfc896] dark:text-[#fba81c]">
                <EthiopianOrthodoxCross className="h-6 w-6" />
              </span>
              <div>
                <p className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100">የሰንበት ትምህርት ቤት ቃል ኪዳን</p>
                <p className="text-xs text-[#8c7140] dark:text-[#fba81c]">Faithful Stewardship & Community Service</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#4d5e70] dark:text-slate-300 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-[#8c7140] dark:text-[#fba81c] font-bold text-base">✓</span>
                <span><strong>Ecclesiastical Alignment:</strong> Built around the departments and structural guidelines of EOTC Sunday Schools.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#8c7140] dark:text-[#fba81c] font-bold text-base">✓</span>
                <span><strong>Role-Governed Integrity:</strong> Clean boundaries between Academic Directors, Treasurers, Teachers, and Registrars.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#8c7140] dark:text-[#fba81c] font-bold text-base">✓</span>
                <span><strong>Bilingual Accessibility:</strong> Designed for seamless parish workflows in Amharic and English.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitments Grid */}
      <section className="bg-[#f5efe3] dark:bg-[#0e1424] py-20 px-5 lg:px-8 border-y border-[#e5dcc8] dark:border-slate-800">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
              መሠረታዊ እሴቶቻችን
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0f243e] dark:text-slate-100 mt-2">
              Values that Guide Simple Senbet
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {commitments.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.number}
                  className="rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-7 shadow-xs transition hover:border-[#b89b60] dark:hover:border-[#fba81c]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f7f2e6] dark:bg-[#1c2438] text-[#8c7140] dark:text-[#fba81c]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-serif text-xl font-bold text-[#c5a866] dark:text-[#fba81c]">{c.number}</span>
                  </div>
                  <p className="text-xs font-bold text-[#8c7140] dark:text-[#fba81c] mb-1">{c.amharicTitle}</p>
                  <h3 className="font-serif text-xl font-bold text-[#0f243e] dark:text-slate-100 mb-2">{c.title}</h3>
                  <p className="text-xs sm:text-sm leading-6 text-[#5b6e80] dark:text-slate-400">{c.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Parish CTA */}
      <section className="bg-[#0a192e] dark:bg-[#070b14] py-16 px-5 lg:px-8 text-white">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfc896] dark:text-[#fba81c]">
              የደብራችሁ ሰንበት ትምህርት ቤት አባል ኖት?
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Connect your Sunday School with Simple Senbet.
            </h3>
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 rounded-xl bg-[#c5a866] dark:bg-[#fba81c] px-6 py-3.5 text-sm font-bold text-[#0a192e] dark:text-slate-950 transition hover:bg-[#d6bc7e] dark:hover:bg-[#f59e0b]"
          >
            <span>Contact Support</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
