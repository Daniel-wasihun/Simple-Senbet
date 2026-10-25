"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRouteForRole } from "@/utils/roleNavigation";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/navbar/languageSwicher";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";

interface DemoAccount {
  role: string;
  label: string;
  amharicLabel: string;
  email: string;
  pass: string;
  targetDashboard: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "academic_director",
    label: "Academic Director",
    amharicLabel: "የትምህርት ኃላፊ",
    email: "director@example.com",
    pass: "Director123!",
    targetDashboard: "/acadamic/super-admin/dashboard",
  },
  {
    role: "superadmin",
    label: "Super Admin",
    amharicLabel: "ዋና አስተዳዳሪ",
    email: "admin@example.com",
    pass: "ChangeMe123!",
    targetDashboard: "/super-admin/dashboard",
  },
  {
    role: "finance_officer",
    label: "Finance Officer",
    amharicLabel: "የሂሳብ ኃላፊ",
    email: "finance@example.com",
    pass: "Finance123!",
    targetDashboard: "/finance/super-admin/dashboard",
  },
  {
    role: "teacher",
    label: "Lead Teacher",
    amharicLabel: "የሰንበት መምህር",
    email: "teacher@example.com",
    pass: "Teacher123!",
    targetDashboard: "/attendance/super-admin/dashboard",
  },
  {
    role: "attendance_officer",
    label: "Attendance Officer",
    amharicLabel: "የቁጥጥር ኃላፊ",
    email: "attendance@example.com",
    pass: "Attendance123!",
    targetDashboard: "/attendance/super-admin/dashboard",
  },
  {
    role: "member_coordinator",
    label: "Registrar / Member",
    amharicLabel: "የምዝገባ ኃላፊ",
    email: "registrar@example.com",
    pass: "Registrar123!",
    targetDashboard: "/member/super-admin/dashboard",
  },
  {
    role: "student",
    label: "Sample Student",
    amharicLabel: "ተማሪ",
    email: "student@example.com",
    pass: "Student123!",
    targetDashboard: "/member/super-admin/dashboard",
  },
];

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  // Instant check to guarantee an authenticated user NEVER sees the login page even for 1 millisecond
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  // Synchronous pre-check: if authenticated in context or storage, redirect immediately without rendering login UI
  useEffect(() => {
    if (user) {
      const destination = getDashboardRouteForRole(user.role);
      router.replace(destination);
      return;
    }

    try {
      const cached = localStorage.getItem("senbet_cached_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.role) {
          const destination = getDashboardRouteForRole(parsed.role);
          router.replace(destination);
          return;
        }
      }
    } catch {}

    setIsCheckingAuth(false);
  }, [user, router]);

  // Pre-fetch all destination dashboard routes immediately for zero-delay navigation
  useEffect(() => {
    router.prefetch("/super-admin/dashboard");
    router.prefetch("/acadamic/super-admin/dashboard");
    router.prefetch("/attendance/super-admin/dashboard");
    router.prefetch("/finance/super-admin/dashboard");
    router.prefetch("/member/super-admin/dashboard");
  }, [router]);

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.pass);
    setSelectedDemo(account.role);
    setError("");
    router.prefetch(account.targetDashboard);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const result = await login(email.trim(), password);
    if (!result.success) {
      const msg =
        result.message ||
        "The provided credentials are incorrect. Please verify your email and password.";
      setError(msg);
      toast.error("Sign-in Failed", { description: msg });
      setBusy(false);
      return;
    }

    const destination = getDashboardRouteForRole(result.user?.role);
    const roleName = result.user?.role?.replace("_", " ") || "Member";

    toast.success(`Welcome, ${result.user?.name || "Member"}!`, {
      description: `Signed in as ${roleName}. Opening dashboard...`,
      duration: 2500,
    });

    // Instant client navigation without sluggish router.refresh() delay
    router.replace(destination);
  }

  // If already authenticated or verifying, do not display login screen at all
  if (isCheckingAuth || user) {
    return <div className="min-h-screen w-full bg-[#fbf9f4] dark:bg-[#0a0e1a]" />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fbf9f4] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] transition-colors duration-0">
      {/* Top Bar on Login Page: NO navigation bar — ONLY Language change and Theme change buttons */}
      <header className="w-full shrink-0 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0e1424]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group" title="Return to Home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#c5a866] dark:border-[#fba81c]/40 bg-[#f5ecda] dark:bg-[#141a29] text-[#7d612e] dark:text-[#fba81c] shadow-2xs transition-transform group-hover:scale-105">
              <EthiopianOrthodoxCross className="h-5 w-5 text-[#8c7140] dark:text-[#fba81c]" />
            </span>
            <span>
              <span className="block font-serif text-base font-bold leading-tight tracking-tight text-[#0f243e] dark:text-slate-100">
                Simple Senbet
              </span>
              <span className="block text-[9px] font-medium tracking-[0.08em] text-[#8c7140] dark:text-[#fba81c]">
                የሰንበት ትምህርት ቤት ፖርታል
              </span>
            </span>
          </Link>

          {/* Top Controls: ONLY Language Change and Theme Change */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Decorative Orthodox background texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(#b89b60_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto w-full max-w-5xl grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* Left Column: Heritage Banner */}
          <section className="space-y-6 lg:pr-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c5a866]/60 dark:border-[#fba81c]/30 bg-[#f4ecd9] dark:bg-[#141a29] px-3.5 py-1 text-xs font-semibold text-[#665335] dark:text-[#fba81c]">
              <span className="text-[#8c7140] dark:text-[#fba81c] font-bold">✝</span>
              <span>የሰንበት ትምህርት ቤት ፖርታል | Sunday School Portal</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0f243e] dark:text-slate-100 leading-[1.16]">
              Rooted in Faith, <br />
              <span className="text-[#8c7140] dark:text-[#fba81c] italic">United in Service.</span>
            </h1>

            <p className="max-w-lg text-sm sm:text-base leading-7 text-[#556778] dark:text-slate-400">
              Sign in to manage student records, coordinate liturgical attendance, review academic
              courses, and guide the next generation in the Ethiopian Orthodox Tewahedo Church tradition.
            </p>

            {/* Scriptural Box */}
            <div className="rounded-2xl border border-[#d6c7a7] dark:border-slate-800 bg-white/90 dark:bg-[#141a29]/90 p-5 shadow-xs backdrop-blur-xs">
              <div className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7f2e6] dark:bg-[#1c2438] text-[#8c7140] dark:text-[#fba81c] border border-[#e5dcc8] dark:border-slate-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-base sm:text-lg font-medium text-[#102746] dark:text-slate-200">
                    «ልጅን በሚሄድበት መንገድ ምራው፥ በሸመገለም ጊዜ ከእርሱ ፈቀቅ አይልም።»
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7140] dark:text-[#fba81c]">
                    ምሳሌ ፳፪፥፮ | Proverbs 22:6
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#f0ebd9] dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-[#6c7b88] dark:text-slate-400">
                <div>✝ ሃይማኖትና ሥርዓት</div>
                <div>📖 መንፈሳዊ ትምህርት</div>
                <div>🤝 ማኅበራዊ አገልግሎት</div>
              </div>
            </div>
          </section>

          {/* Right Column: Clean & Focused Login Card */}
          <section className="relative mx-auto w-full max-w-md rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-7 sm:p-9 shadow-[0_20px_50px_-20px_rgba(16,39,70,0.18)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-[#f0ebd9] dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f243e] dark:bg-[#1c2438] text-[#dfc896] dark:text-[#fba81c] shadow-xs">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c7140] dark:text-[#fba81c]">
                    ደህንነቱ የተጠበቀ መግቢያ
                  </p>
                  <h2 className="font-serif text-2xl font-bold text-[#0f243e] dark:text-slate-100">Sign In to Portal</h2>
                </div>
              </div>
              <span className="text-xl text-[#8c7140] dark:text-[#fba81c]" title="Ethiopian Cross">
                ✝
              </span>
            </div>

            {/* Quick-Fill Demo Roles Picker */}
            <div className="mt-4 rounded-xl border border-[#e8dfc9] dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#111624] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#71592c] dark:text-[#fba81c]">
                  <Sparkles className="h-3 w-3 text-[#b89b60] dark:text-[#fba81c]" /> Quick-Fill Demo Roles
                </span>
                <span className="text-[10px] text-[#8e9aa5] dark:text-slate-400">Click to auto-populate</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = selectedDemo === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#0f243e] text-[#f4eedb] dark:bg-[#fba81c] dark:text-slate-950 shadow-xs font-semibold"
                          : "bg-white dark:bg-[#1c2438] text-[#465a6e] dark:text-slate-300 border border-[#e5dcce] dark:border-slate-700 hover:border-[#b89b60] dark:hover:border-[#fba81c] hover:text-[#0f243e] dark:hover:text-white"
                      }`}
                    >
                      {acc.label}
                    </button>
                  );
                })}
              </div>
              {selectedDemo && (
                <div className="mt-2.5 pt-2 border-t border-[#f0ebd9] dark:border-slate-800 flex items-center justify-between text-[10px] text-[#637483] dark:text-slate-400">
                  <span className="truncate">
                    Redirects to: <code className="font-semibold text-[#0f243e] dark:text-[#fba81c]">{DEMO_ACCOUNTS.find(a => a.role === selectedDemo)?.targetDashboard}</code>
                  </span>
                  <span className="text-[#3c763d] dark:text-emerald-400 flex items-center gap-0.5 font-medium shrink-0 ml-2">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-300 leading-relaxed"
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50] dark:text-slate-300">
                  Email Address / ኢሜይል
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedDemo(null);
                  }}
                  disabled={busy || isLoading}
                  className="w-full rounded-xl border border-[#d2d8dc] dark:border-slate-700 bg-[#fcfbf9] dark:bg-[#1c2438] text-[#132438] dark:text-slate-100 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#a0a8b0] dark:placeholder:text-slate-500 focus:border-[#0f243e] dark:focus:border-[#fba81c] focus:ring-4 focus:ring-[#0f243e]/10 dark:focus:ring-[#fba81c]/10"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-[#2c3e50] dark:text-slate-300"
                  >
                    Password / የይለፍ ቃል
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#8c7140] dark:text-[#fba81c] hover:text-[#0f243e] dark:hover:text-[#f59e0b] transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSelectedDemo(null);
                    }}
                    disabled={busy || isLoading}
                    className="w-full rounded-xl border border-[#d2d8dc] dark:border-slate-700 bg-[#fcfbf9] dark:bg-[#1c2438] text-[#132438] dark:text-slate-100 px-3.5 py-2.5 pr-11 text-sm outline-none transition focus:border-[#0f243e] dark:focus:border-[#fba81c] focus:ring-4 focus:ring-[#0f243e]/10 dark:focus:ring-[#fba81c]/10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#7e8c99] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-white cursor-pointer"
                    aria-label={visible ? "Hide password" : "Show password"}
                  >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f243e] dark:bg-[#fba81c] hover:bg-[#1a385f] dark:hover:bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 shadow-md shadow-[#0f243e]/20 dark:shadow-none transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {busy ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#dfc896] dark:text-slate-900" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4 text-[#dfc896] dark:text-slate-950" />
                  </>
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-5 pt-4 border-t border-[#f0ebd9] dark:border-slate-800 flex items-center justify-between text-xs">
              <Link
                href="/"
                className="inline-flex items-center gap-1 font-medium text-[#657686] dark:text-slate-400 hover:text-[#0f243e] dark:hover:text-[#fba81c] transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
              <Link
                href="/register"
                className="font-semibold text-[#8c7140] dark:text-[#fba81c] hover:text-[#0f243e] dark:hover:text-[#f59e0b] transition"
              >
                Member Registration
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
