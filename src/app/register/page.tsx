"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSenbet();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifiedStep, setVerifiedStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Please fill in all registration fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password, fullName);
      setVerifiedStep(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToCreateSchool = () => {
    router.push("/create-school");
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageSwitcher variant="header" />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-12 w-12 rounded-2xl bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black shadow-lg text-2xl">
              ✝
            </div>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white font-serif">{t("auth.register")}</h2>
          <p className="text-xs text-slate-400">የሰንበት ትምህርት ቤት አስተዳዳሪ አካውንት መመዝገቢያ</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl p-6 sm:p-8">
          {!verifiedStep ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Step 1: Admin Registration</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Register as the school owner/admin to manage your Sunday School
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

              <form onSubmit={handleRegister} className="space-y-4">
                <FormField label={t("students.fullName")} required>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="መምህር ተክለ ማርያም"
                    icon={User}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </FormField>

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
                    minLength={6}
                  />
                </FormField>

                <Button
                  type="submit"
                  variant="gold"
                  isLoading={loading}
                  className="w-full h-10 mt-2 font-bold"
                >
                  {t("auth.register")}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Already registered?</span>
                <Link href="/login" className="text-amber-400 hover:underline font-medium">
                  {t("auth.login")}
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Email Verified Successfully!</h3>
              <p className="text-xs text-slate-400">
                Welcome, <strong>{fullName}</strong>. Your account is authenticated.
              </p>

              <div className="rounded-xl bg-blue-950/60 border border-blue-800 p-4 text-xs text-blue-200 text-left">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <ShieldCheck className="h-4 w-4 text-brand-gold" />
                  <span>Role Granted: School Owner / Admin</span>
                </div>
                <p>
                  You are now ready to establish your Sunday School (ሰንበት ትምህርት ቤት) profile and
                  configure classes.
                </p>
              </div>

              <Button
                onClick={handleProceedToCreateSchool}
                variant="gold"
                className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Step 2: Create Senbet School</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
