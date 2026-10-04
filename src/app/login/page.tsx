"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSenbet();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("auth.invalidCredentials"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageSwitcher variant="header" />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Emblem */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-12 w-12 rounded-2xl bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black shadow-lg text-2xl">
              ✝
            </div>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white font-serif">
            {t("auth.login")} — {t("common.appName")}
          </h2>
          <p className="text-xs text-slate-400">ወደ ሰንበት ትምህርት ቤት መረጃ ቋት ይግቡ</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t("auth.login")}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {t("auth.email")} & {t("auth.password")}
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <InlineAlert
                variant="error"
                title={t("common.error")}
                message={error}
                onClose={() => setError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t("auth.email")} required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@senbet.org"
                icon={Mail}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </FormField>

            <FormField label={t("auth.password")} required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full h-10 mt-2 font-semibold"
            >
              {t("auth.login")}
            </Button>
          </form>

          {/* Quick Demo Fills for Roles */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 mb-2 font-medium text-center">
              Quick Test Login by Role:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@senbet.org");
                  setPassword("password123");
                }}
                className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium hover:bg-amber-500/20 text-center transition-colors"
              >
                👑 Owner / Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("teacher@senbet.org");
                  setPassword("password123");
                }}
                className="px-2 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium hover:bg-blue-500/20 text-center transition-colors"
              >
                📖 Teacher
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("student@senbet.org");
                  setPassword("password123");
                }}
                className="px-2 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 text-center transition-colors"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("staff@senbet.org");
                  setPassword("password123");
                }}
                className="px-2 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium hover:bg-purple-500/20 text-center transition-colors"
              >
                📋 Staff
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>New Sunday School?</span>
            <Link
              href="/register"
              className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{t("auth.createSchool")}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
