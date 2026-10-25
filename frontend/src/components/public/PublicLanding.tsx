import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  GraduationCap,
  HeartHandshake,
  Music,
  Scroll,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PublicSiteLayout } from "@/components/public/PublicSiteLayout";

const PILLARS = [
  {
    number: "፩",
    amharicTitle: "ቅዱሳት መጻሕፍትና ትምህርተ ሃይማኖት",
    title: "Scripture & Dogmatics",
    icon: BookOpen,
    description:
      "Deepening understanding of the Holy Scriptures (ብሉይና ሐዲስ ኪዳን), Orthodox Creed (ጸሎተ ሃይማኖት), and Patristic teachings handed down through church fathers.",
    highlight: "Old & New Testament, Dogma, Mystery of Incarnation",
  },
  {
    number: "፪",
    amharicTitle: "የቅዱስ ያሬድ ዜማና ሥርዓተ ማኅሌት",
    title: "St. Yared Hymnology",
    icon: Music,
    description:
      "Imparting sacred Ethiopian chant traditions composed by St. Yared (ድጓ፣ ጾመ ድጓ፣ ዝማሬ፣ መዋሥዕት) along with sacred ceremonial instruments (ከበሮ፣ ጸናጽል፣ መቋሚያ) and liturgical hymns.",
    highlight: "Zema notations, Liturgical Mahlet, Aquaquam",
  },
  {
    number: "፫",
    amharicTitle: "ሥርዓተ ቤተ ክርስቲያንና ታሪክ",
    title: "Church Liturgy & History",
    icon: Scroll,
    description:
      "Guiding students through the Seven Holy Mysteries (ሰባቱ ምሥጢራተ ቤተ ክርስቲያን), Divine Liturgy (ቅዳሴ), canonical feasts, fasts, and the profound history of the Ethiopian Church.",
    highlight: "Sacraments, Ecclesiastical History, Canonical Fasts",
  },
  {
    number: "፬",
    amharicTitle: "ክርስቲያናዊ ሥነ ምግባርና ማኅበራዊ አገልግሎት",
    title: "Christian Ethics & Diaconia",
    icon: HeartHandshake,
    description:
      "Fostering Christian charity, humility, moral uprightness, parish fellowship, and active volunteer service to the sick, elderly, and parish community.",
    highlight: "Youth fellowship, Charity, Pastoral visitation",
  },
];

const DEPARTMENTS = [
  {
    icon: GraduationCap,
    number: "01",
    title: "የትምህርት ክፍል (Academics)",
    desc: "Oversee academic years, curriculum progression, course syllabi, semester schedules, and teaching assignments across all Sunday school levels.",
    link: "/login",
  },
  {
    icon: CalendarCheck,
    number: "02",
    title: "የቁጥጥርና ክትትል (Attendance)",
    desc: "Seamless weekly recording of Divine Liturgy participation, Sunday school class attendance, and student punctuality with instant analytics.",
    link: "/login",
  },
  {
    icon: DollarSign,
    number: "03",
    title: "የሂሳብና በጀት ክፍል (Finance)",
    desc: "Record monthly contributions, feast-day dues, book sales, and receipts with role-governed transparency and exportable financial summaries.",
    link: "/login",
  },
  {
    icon: UsersRound,
    number: "04",
    title: "የአባላትና ምዝገባ (Registrar & Members)",
    desc: "Organize baptized student directories, family contacts, spiritual father details, and demographic cohorts with strict role confidentiality.",
    link: "/login",
  },
];

const FAQS = [
  {
    q: "What is Simple Senbet?",
    a: "Simple Senbet is a specialized, modern institutional management platform designed specifically for Ethiopian Orthodox Tewahedo Church Sunday Schools (የሰንበት ትምህርት ቤቶች). It streamlines academic records, liturgical attendance, course assessments, member directories, and contributions in one secure workspace.",
  },
  {
    q: "How does role-based security protect our parish data?",
    a: "Every staff member (Super Administrator, Academic Director, Finance Officer, Attendance Coordinator, Teacher, or Student) is bound by strict role policies. Teachers only access their assigned classes, finance officers manage transactions with audit logs, and member records remain confidential.",
  },
  {
    q: "Can teachers record attendance and grades from mobile devices?",
    a: "Yes. The platform is fully responsive and optimized for smartphones, tablets, and desktop workstations, allowing teachers to mark attendance directly during Sunday school sessions or after Holy Liturgy.",
  },
  {
    q: "How does our parish Sunday School get access?",
    a: "Accounts are provisioned by your parish Sunday School administrator or lead coordinator. To get your parish setup or acquire credentials, please sign in through the School Portal or contact your parish office.",
  },
];

function InteractivePortalPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#c5a866]/30 dark:from-[#fba81c]/20 to-[#0f243e]/20 blur-lg" />
      <div className="relative overflow-hidden rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-[#fdfbf6] dark:bg-[#141a29] shadow-[0_25px_60px_-15px_rgba(15,36,62,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* Top OS Window Header */}
        <div className="flex h-12 items-center justify-between border-b border-[#ebd8b7] dark:border-slate-800 bg-[#f4ebda] dark:bg-[#0e1424] px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0f243e] dark:bg-[#1c2438] text-[11px] font-bold text-[#dfc896] dark:text-[#fba81c]">
              ✝
            </span>
            <span className="text-xs font-bold text-[#0f243e] dark:text-slate-100">Simple Senbet</span>
            <span className="text-[10px] text-[#8c7140] dark:text-[#fba81c] font-medium hidden sm:inline">
              | ደብረ ምጥማቅ ሰንበት ት/ቤት
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#102746]/10 dark:bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#102746] dark:text-slate-300">
              2026/2027 Academic Year
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0f243e] dark:bg-[#fba81c] text-[10px] font-bold text-white dark:text-slate-950">
              AD
            </span>
          </div>
        </div>

        {/* Dashboard Preview Inner */}
        <div className="grid min-h-[340px] grid-cols-[125px_1fr] sm:grid-cols-[150px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-[#ebd8b7] dark:border-slate-800 bg-[#faf6ed] dark:bg-[#111624] p-3 text-left">
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8c7140] dark:text-[#fba81c]">
              የክፍል ክፍሎች
            </p>
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-[#0f243e] dark:bg-[#1c2438] px-2.5 py-1.5 text-[10px] font-semibold text-[#f8f4ea] dark:text-[#fba81c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#dfc896] dark:bg-[#fba81c]" />
                ዋና ገጽ (Overview)
              </div>
              <div className="px-2.5 py-1.5 text-[10px] text-[#556778] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-white">
                ተማሪዎች (Students)
              </div>
              <div className="px-2.5 py-1.5 text-[10px] text-[#556778] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-white">
                ትምህርቶች (Courses)
              </div>
              <div className="px-2.5 py-1.5 text-[10px] text-[#556778] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-white">
                ክትትል (Attendance)
              </div>
              <div className="px-2.5 py-1.5 text-[10px] text-[#556778] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-white">
                ውጤት (Gradebook)
              </div>
            </div>
            <div className="mt-6 border-t border-[#ebd8b7] dark:border-slate-800 pt-3">
              <p className="px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8c7140] dark:text-[#fba81c]">
                ሥርዓት (System)
              </p>
              <div className="px-2.5 py-1.5 text-[10px] text-[#556778] dark:text-slate-400">ቅንብሮች (Settings)</div>
            </div>
          </aside>

          {/* Body */}
          <div className="p-4 sm:p-5 text-left bg-white dark:bg-[#141a29]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8c7140] dark:text-[#fba81c]">
                  Parish Dashboard Preview
                </p>
                <h4 className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100">
                  እንኳን ደህና መጡ (Welcome)
                </h4>
              </div>
              <span className="rounded-md border border-[#c5a866]/40 dark:border-[#fba81c]/30 bg-[#f7f2e4] dark:bg-[#1c2438] px-2 py-1 text-[9px] font-semibold text-[#7d6738] dark:text-[#fba81c]">
                Sem. I - 2026
              </span>
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[#ebd8b7] dark:border-slate-800 bg-white dark:bg-[#1c2438] p-2.5">
                <p className="text-[9px] font-medium text-[#738392] dark:text-slate-400">Active Students</p>
                <p className="mt-1 text-base font-bold text-[#0f243e] dark:text-slate-100">342</p>
                <p className="text-[8px] font-medium text-[#3b7c5e] dark:text-emerald-400">+28 enrolled</p>
              </div>
              <div className="rounded-xl border border-[#ebd8b7] dark:border-slate-800 bg-white dark:bg-[#1c2438] p-2.5">
                <p className="text-[9px] font-medium text-[#738392] dark:text-slate-400">Today's Liturgy</p>
                <p className="mt-1 text-base font-bold text-[#0f243e] dark:text-slate-100">93.4%</p>
                <p className="text-[8px] font-medium text-[#3b7c5e] dark:text-emerald-400">319 Present</p>
              </div>
              <div className="rounded-xl border border-[#ebd8b7] dark:border-slate-800 bg-white dark:bg-[#1c2438] p-2.5">
                <p className="text-[9px] font-medium text-[#738392] dark:text-slate-400">Classes</p>
                <p className="mt-1 text-base font-bold text-[#0f243e] dark:text-slate-100">14</p>
                <p className="text-[8px] text-[#8c7140] dark:text-[#fba81c]">4 Divisions</p>
              </div>
            </div>

            {/* Timetable row */}
            <div className="mt-4 rounded-xl border border-[#ebd8b7] dark:border-slate-800 bg-white dark:bg-[#1c2438] p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#0f243e] dark:text-slate-200 border-b border-[#f2ebd9] dark:border-slate-800 pb-1.5">
                <span>የዛሬ ክፍለ ጊዜያት (Today's Sunday Classes)</span>
                <span className="text-[#8c7140] dark:text-[#fba81c] font-medium">ጥቅምት 15</span>
              </div>
              <div className="mt-2.5 space-y-2 text-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#8c7140] dark:bg-[#fba81c]" />
                    <span className="font-semibold text-[#2c3e50] dark:text-slate-300">የያሬድ ዜማ (St. Yared Chant)</span>
                  </div>
                  <span className="text-[#738392] dark:text-slate-400">09:00 - 10:15 | አዳራሽ</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0f243e] dark:bg-[#fba81c]" />
                    <span className="font-semibold text-[#2c3e50] dark:text-slate-300">ትምህርተ ሃይማኖት (Orthodox Creed)</span>
                  </div>
                  <span className="text-[#738392] dark:text-slate-400">10:30 - 11:45 | ክፍል ፫</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between border-t border-[#ebd8b7] dark:border-slate-800 bg-[#f4ebda] dark:bg-[#0e1424] px-4 py-2 text-[9px] text-[#6b7c8c] dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-[#3b7c5e] dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> All parish records encrypted & synced
          </span>
          <span className="text-[#8c7140] dark:text-[#fba81c] font-semibold">Simple Senbet v2.0</span>
        </div>
      </div>
    </div>
  );
}

export function PublicLanding() {
  return (
    <PublicSiteLayout>
      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-[#0a192e] dark:bg-[#050810] text-[#fbf6ec]">
          {/* Atmospheric background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(#d4af37 1px, transparent 1px), radial-gradient(#d4af37 1px, #0a192e 1px)",
              backgroundSize: "32px 32px",
              backgroundPosition: "0 0, 16px 16px",
            }}
          />
          <div className="pointer-events-none absolute -top-40 -right-40 h-[38rem] w-[38rem] rounded-full border border-[#c5a866]/20 bg-[#c5a866]/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[38rem] w-[38rem] rounded-full border border-[#0f243e]/40 bg-[#16355d]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
              {/* Text content */}
              <div className="space-y-6 text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a866]/60 dark:border-[#fba81c]/40 bg-[#c5a866]/15 dark:bg-[#fba81c]/10 px-4 py-1.5 text-xs font-semibold text-[#f5e6c2] dark:text-[#fba81c] backdrop-blur-md">
                  <span className="text-[#e2ca91] dark:text-[#fba81c] font-bold">✝</span>
                  <span>የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሰንበት ትምህርት ቤት</span>
                </div>

                <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-[#fdfbf6] leading-[1.12]">
                  Rooted in the Faith. <br />
                  <span className="text-[#dfc896] dark:text-[#fba81c] italic">Equipped for Generations.</span>
                </h1>

                <p className="max-w-xl text-[16px] leading-8 text-[#d4dde5] dark:text-slate-300">
                  Simple Senbet is a purposeful management system created to serve Ethiopian Orthodox
                  Tewahedo Church Sunday Schools. Seamlessly organize spiritual curricula, weekly
                  liturgical attendance, student registries, and parish contributions in one dependable home.
                </p>

                {/* Biblical Banner */}
                <div className="rounded-xl border-l-4 border-[#c5a866] dark:border-[#fba81c] bg-white/5 backdrop-blur-md p-4 text-xs text-[#ebd9b2]">
                  <p className="font-serif text-[15px] italic text-[#fbf6ec]">
                    «ልጅን በሚሄድበት መንገድ ምራው፥ በሸመገለም ጊዜ ከእርሱ ፈቀቅ አይልም።»
                  </p>
                  <p className="mt-1 font-semibold uppercase tracking-[0.14em] text-[#c5a866] dark:text-[#fba81c]">
                    ምሳሌ ፳፪፥፮ | Proverbs 22:6
                  </p>
                </div>

                {/* Call To Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-[#c5a866] dark:bg-[#fba81c] px-6 py-3.5 text-sm font-bold text-[#0a192e] dark:text-slate-950 shadow-lg shadow-[#c5a866]/20 transition-all hover:bg-[#d6bc7e] dark:hover:bg-[#f59e0b] hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <span>Enter School Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="#curriculum"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                  >
                    <span>Explore Curriculum</span>
                    <ArrowRight className="h-4 w-4 text-[#c5a866] dark:text-[#fba81c]" />
                  </Link>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs text-[#a2b2c4]">
                  <span className="flex items-center gap-1 text-[#dfc896] dark:text-[#fba81c]">
                    <ShieldCheck className="h-4 w-4" /> Role-Governed Access
                  </span>
                  <span>•</span>
                  <span>Parish Sunday School Records</span>
                  <span>•</span>
                  <span>Amharic & English</span>
                </div>
              </div>

              {/* Graphic illustration / interactive preview */}
              <div className="w-full">
                <InteractivePortalPreview />
              </div>
            </div>
          </div>

          <div className="h-1.5 border-y border-[#c5a866]/50 dark:border-[#fba81c]/30 bg-gradient-to-r from-[#0a192e] via-[#c5a866] to-[#0a192e] dark:via-[#fba81c]" />
        </section>

        {/* FOUR PILLARS SECTION */}
        <section id="curriculum" className="scroll-mt-20 bg-[#faf6ee] dark:bg-[#0a0e1a] py-20 px-5 lg:px-8 border-b border-[#e5dcc8] dark:border-slate-800">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
                <span>✝</span>
                <span>የሰንበት ትምህርት ቤት ማዕዘናት</span>
                <span>✝</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0f243e] dark:text-slate-100">
                Four Sacred Pillars of Learning
              </h2>
              <p className="text-sm sm:text-base leading-7 text-[#607182] dark:text-slate-400">
                Our curriculum reflects the depth of the Ethiopian Orthodox Tewahedo Church,
                providing structured pathways from early childhood through deaconate and youth maturity.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="relative rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-6 sm:p-7 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#c5a866] dark:hover:border-[#fba81c] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f7f2e6] dark:bg-[#1c2438] text-[#8c7140] dark:text-[#fba81c] border border-[#e5dcce] dark:border-slate-700">
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className="font-serif text-xl font-bold text-[#c5a866] dark:text-[#fba81c]">
                          {pillar.number}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#8c7140] dark:text-[#fba81c] mb-1">
                        {pillar.amharicTitle}
                      </p>
                      <h3 className="font-serif text-xl font-bold text-[#0f243e] dark:text-slate-100 mb-3">
                        {pillar.title}
                      </h3>
                      <p className="text-xs leading-6 text-[#5c6e80] dark:text-slate-400">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#f2ebd9] dark:border-slate-800 text-[11px] font-semibold text-[#7d6738] dark:text-[#fba81c]">
                      {pillar.highlight}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* DEPARTMENTS & CAPABILITIES SECTION */}
        <section id="sunday-school" className="scroll-mt-20 bg-white dark:bg-[#0e1424] py-20 px-5 lg:px-8 border-b border-[#e5dcc8] dark:border-slate-800">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-center">
              <div className="space-y-5 text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
                  የአገልግሎት ክፍሎችና ተግባራት
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0f243e] dark:text-slate-100 leading-tight">
                  Tailored Workspaces for Every Sunday School Role.
                </h2>
                <p className="text-sm sm:text-base leading-7 text-[#5d6f80] dark:text-slate-400">
                  Every parish department operates with clarity. From curriculum directors scheduling courses
                  to teachers marking attendance after divine liturgy and finance officers tracking contributions,
                  Simple Senbet coordinates every responsibility.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f243e] dark:bg-[#fba81c] px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 shadow-xs hover:bg-[#1a385f] dark:hover:bg-[#f59e0b] transition-all"
                  >
                    <span>Sign in to your role</span>
                    <ArrowRight className="h-4 w-4 text-[#dfc896] dark:text-slate-950" />
                  </Link>
                </div>
              </div>

              {/* Department Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;
                  return (
                    <div
                      key={dept.number}
                      className="rounded-xl border border-[#e5dcc8] dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#141a29] p-5 transition-all hover:bg-white dark:hover:bg-[#1c2438] hover:border-[#b89b60] dark:hover:border-[#fba81c] hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0f243e] dark:bg-[#1c2438] text-[#dfc896] dark:text-[#fba81c]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-bold text-[#b89b60] dark:text-[#fba81c]">{dept.number}</span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-[#0f243e] dark:text-slate-100 mb-1.5">
                        {dept.title}
                      </h4>
                      <p className="text-xs leading-5 text-[#5e7081] dark:text-slate-400">{dept.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PARISH TESTIMONIAL & PATRISTIC BANNER */}
        <section className="relative overflow-hidden bg-[#0f243e] dark:bg-[#070b14] py-16 px-5 lg:px-8 text-white text-center">
          <div className="relative mx-auto max-w-4xl space-y-6">
            <span className="text-3xl text-[#dfc896] dark:text-[#fba81c]">✝</span>
            <blockquote className="font-serif text-2xl sm:text-4xl font-normal leading-snug tracking-tight text-[#fbf8f0]">
              «የእግዚአብሔርን ቃል የነገሯችሁን ዋናዎቻችሁን አስቡ፥ የኑሯቸውንም ፍሬ እየተመለከታችሁ በእምነት ምሰሏቸው።»
            </blockquote>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dfc896] dark:text-[#fba81c]">
              ወደ ዕብራውያን ፲፫፥፯ | Hebrews 13:7
            </p>
            <div className="mx-auto h-px w-16 bg-[#c5a866]/50 dark:bg-[#fba81c]/50" />
            <p className="text-xs sm:text-sm text-[#cbd6e2] dark:text-slate-300 max-w-xl mx-auto">
              Preserving sacred heritage, teaching with dedication, and building a united Christian family for our Sunday Schools worldwide.
            </p>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="bg-[#faf6ee] dark:bg-[#0a0e1a] py-20 px-5 lg:px-8 border-b border-[#e5dcc8] dark:border-slate-800">
          <div className="mx-auto max-w-5xl">
            <div className="text-center space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
                ተደጋግመው የሚጠየቁ ጥያቄዎች
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0f243e] dark:text-slate-100">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-5 transition-all open:border-[#b89b60] dark:open:border-[#fba81c] open:shadow-xs"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-left font-serif text-base sm:text-lg font-semibold text-[#0f243e] dark:text-slate-100 marker:hidden">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#8c7140] dark:text-[#fba81c] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm leading-6 text-[#5b6e80] dark:text-slate-400 pt-2 border-t border-[#f0ebd9] dark:border-slate-800">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* READY TO BEGIN SECTION */}
        <section className="bg-[#0a192e] dark:bg-[#070b14] py-16 px-5 lg:px-8 text-white border-t border-[#c5a866]/40 dark:border-slate-800">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfc896] dark:text-[#fba81c]">
                የሰንበት ትምህርት ቤት አገልግሎትዎን ያዘምኑ
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Ready to empower your Sunday School ministry?
              </h3>
              <p className="text-xs sm:text-sm text-[#cbd6e2] dark:text-slate-300 max-w-xl">
                Sign in to your assigned role or get in touch with the parish administration team to configure your school.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5a866] dark:bg-[#fba81c] px-6 py-3.5 text-sm font-bold text-[#0a192e] dark:text-slate-950 shadow-md transition hover:bg-[#d8bf84] dark:hover:bg-[#f59e0b]"
              >
                <span>Access Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 dark:border-slate-700 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 dark:hover:bg-slate-800"
              >
                <span>Contact Parish Support</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteLayout>
  );
}
