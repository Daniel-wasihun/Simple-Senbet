"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Church, Phone, MapPin, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";

export default function CreateSchoolPage() {
  const router = useRouter();
  const { createSchool, user } = useSenbet();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [parishName, setParishName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parishName) {
      setError("Please provide both School Name and Parish Name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createSchool({
        name,
        parishName,
        code: code || name.substring(0, 4).toUpperCase() + "-01",
        phone,
        address,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create school");
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
          <div className="inline-flex h-12 w-12 rounded-2xl bg-brand-gold items-center justify-center text-brand-blue-dark font-black shadow-lg text-2xl mb-2">
            ✝
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">{t("auth.createSchool")}</h2>
          <p className="text-xs text-slate-400">የሰንበት ትምህርት ቤትዎን መረጃ እዚህ ያቋቁሙ</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t("settings.schoolProfile")}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create your Sunday School and establish your Owner / Admin privileges
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
            <FormField label={t("settings.schoolName")} required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ደብረ መዊዕ ቅዱስ ጊዮርጊስ ሰንበት ት/ቤት"
                icon={Building2}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </FormField>

            <FormField label={t("settings.parishChurch")} required>
              <Input
                type="text"
                value={parishName}
                onChange={(e) => setParishName(e.target.value)}
                placeholder="የደብረ መዊዕ ቅዱስ ጊዮርጊስ እና በዓታ ለማርያም ቤተክርስቲያን"
                icon={Church}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={t("settings.schoolCode")}>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="DM-01"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </FormField>

              <FormField label={t("students.parentPhone")}>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  icon={Phone}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </FormField>
            </div>

            <FormField label={t("settings.address")}>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="አዲስ አበባ (Addis Ababa), Ethiopia"
                icon={MapPin}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </FormField>

            <div className="rounded-xl bg-blue-950/50 border border-blue-800/80 p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Owner Role Assignment</p>
                <p className="text-[11px] text-blue-300">
                  Administrator: <strong>{user?.full_name || "You"}</strong> (
                  {user?.email || "admin"}).
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              isLoading={loading}
              className="w-full h-11 text-sm font-bold shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <span>
                {t("common.save")} & {t("nav.dashboard")}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
