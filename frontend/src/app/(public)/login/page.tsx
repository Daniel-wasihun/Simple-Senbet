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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  // Pre-fetch all dashboard routes immediately for lightning-fast transitions
  useEffect(() => {
    router.prefetch("/super-admin/dashboard");
    router.prefetch("/acadamic/super-admin/dashboard");
    router.prefetch("/attendance/super-admin/dashboard");
    router.prefetch("/finance/super-admin/dashboard");
    router.prefetch("/member/super-admin/dashboard");
  }, [router]);

  // If already logged in, redirect immediately to the user's role-specific dashboard
  useEffect(() => {
    if (!isLoading && user) {
      const destination = getDashboardRouteForRole(user.role);
      router.push(destination);
    }
  }, [isLoading, router, user]);

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
      duration: 3000,
    });

    // Instant client navigation without sluggish router.refresh() delay
    router.push(destination);
  }

  return (
    <main className="relative min-h-[calc(100vh-8rem)] bg-[#fbf9f4] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Decorative Orthodox background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(#b89b60_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative mx-auto w-full max-w-5xl grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        {/* Left Column: Heritage Banner */}
        <section className="space-y-6 lg:pr-4">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c5a866]/60 bg-[#f4ecd9] px-3.5 py-1 text-xs font-semibold text-[#665335]">
            <span className="text-[#8c7140] font-bold">✝</span>
            <span>የሰንበት ትምህርት ቤት ፖርታል | Sunday School Portal</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0f243e] leading-[1.16]">
            Rooted in Faith, <br />
            <span className="text-[#8c7140] italic">United in Service.</span>
          </h1>

          <p className="max-w-lg text-sm sm:text-base leading-7 text-[#556778]">
            Sign in to manage student records, coordinate liturgical attendance, review academic
            courses, and guide the next generation in the Ethiopian Orthodox Tewahedo Church tradition.
          </p>

          {/* Scriptural Box */}
          <div className="rounded-2xl border border-[#d6c7a7] bg-white/90 p-5 shadow-xs backdrop-blur-xs">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7f2e6] text-[#8c7140] border border-[#e5dcc8]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-base sm:text-lg font-medium text-[#102746]">
                  «ልጅን በሚሄድበት መንገድ ምራው፥ በሸመገለም ጊዜ ከእርሱ ፈቀቅ አይልም።»
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7140]">
                  ምሳሌ ፳፪፥፮ | Proverbs 22:6
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#f0ebd9] grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-[#6c7b88]">
              <div>✝ ሃይማኖትና ሥርዓት</div>
              <div>📖 መንፈሳዊ ትምህርት</div>
              <div>🤝 ማኅበራዊ አገልግሎት</div>
            </div>
          </div>
        </section>

        {/* Right Column: Clean & Focused Login Card */}
        <section className="relative mx-auto w-full max-w-md rounded-2xl border border-[#d8ccb4] bg-white p-7 sm:p-9 shadow-[0_20px_50px_-20px_rgba(16,39,70,0.18)]">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#f0ebd9] pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f243e] text-[#dfc896] shadow-sm">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c7140]">
                  ደህንነቱ የተጠበቀ መግቢያ
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#0f243e]">Sign In to Portal</h2>
              </div>
            </div>
            <span className="text-xl text-[#8c7140]" title="Ethiopian Cross">
              ✝
            </span>
          </div>

          {/* Quick-Fill Demo Roles Picker */}
          <div className="mt-4 rounded-xl border border-[#e8dfc9] bg-[#fbf9f4] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#71592c]">
                <Sparkles className="h-3 w-3 text-[#b89b60]" /> Quick-Fill Demo Roles
              </span>
              <span className="text-[10px] text-[#8e9aa5]">Click to auto-populate</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isActive = selectedDemo === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-[#0f243e] text-[#f4eedb] shadow-sm font-semibold"
                        : "bg-white text-[#465a6e] border border-[#e5dcce] hover:border-[#b89b60] hover:text-[#0f243e]"
                    }`}
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
            {selectedDemo && (
              <div className="mt-2.5 pt-2 border-t border-[#f0ebd9] flex items-center justify-between text-[10px] text-[#637483]">
                <span className="truncate">
                  Redirects to: <code className="font-semibold text-[#0f243e]">{DEMO_ACCOUNTS.find(a => a.role === selectedDemo)?.targetDashboard}</code>
                </span>
                <span className="text-[#3c763d] flex items-center gap-0.5 font-medium shrink-0 ml-2">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 leading-relaxed"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#2c3e50]">
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
                className="w-full rounded-xl border border-[#d2d8dc] bg-[#fcfbf9] px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#a0a8b0] focus:border-[#0f243e] focus:ring-4 focus:ring-[#0f243e]/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#2c3e50]"
                >
                  Password / የይለፍ ቃል
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#8c7140] hover:text-[#0f243e] transition"
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
                  className="w-full rounded-xl border border-[#d2d8dc] bg-[#fcfbf9] px-3.5 py-2.5 pr-11 text-sm outline-none transition focus:border-[#0f243e] focus:ring-4 focus:ring-[#0f243e]/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#7e8c99] hover:text-[#0f243e]"
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f243e] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0f243e]/20 transition hover:bg-[#1a385f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#dfc896]" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-[#dfc896]" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 pt-4 border-t border-[#f0ebd9] flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-[#657686] hover:text-[#0f243e] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
            <Link
              href="/register"
              className="font-semibold text-[#8c7140] hover:text-[#0f243e] transition"
            >
              Member Registration
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
