"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Building2, Church, ShieldCheck } from "lucide-react";
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
  const [schoolName, setSchoolName] = useState("");
  const [parishName, setParishName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !schoolName) {
      setError(t("auth.requiredFields"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password, fullName, {
        name: schoolName,
        parishName: parishName || schoolName,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
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

      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-12 w-12 rounded-2xl bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black shadow-lg text-2xl">
              ✝
            </div>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white font-serif">{t("auth.registerTitle")}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {t("auth.adminNotice")}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <ShieldCheck className="h-5 w-5 text-brand-gold shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">{t("auth.ownerSetup")}</h3>
              <p className="text-[11px] text-slate-400">
                {t("auth.ownerSetupDesc")}
              </p>
            </div>
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
            {/* Admin Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

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

            {/* School Info */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <FormField label={t("auth.schoolName")} required>
                <Input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="ቅዱስ ጊዮርጊስ ሰንበት ት/ቤት"
                  icon={Building2}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </FormField>

              <FormField label={t("auth.parishName")}>
                <Input
                  type="text"
                  value={parishName}
                  onChange={(e) => setParishName(e.target.value)}
                  placeholder="ቅዱስ ጊዮርጊስ ቤተክርስቲያን"
                  icon={Church}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </FormField>
            </div>

            <Button
              type="submit"
              variant="gold"
              isLoading={loading}
              className="w-full h-11 mt-3 font-bold text-sm tracking-wide shadow-md"
            >
              {t("auth.register")} &amp; {t("auth.createSchoolTitle")}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>{t("auth.haveAccount")}</span>
            <Link href="/login" className="text-amber-400 hover:underline font-semibold">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
