"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { promotionService } from "@/services/promotion.service";
import { AppSelect } from "@/components/ui/AppSelect";
import { PromotionsShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";

type Item = { id: number; name?: string | Record<string, string> };
type Simulation = Record<string, unknown>;

function rows(payload: unknown): Item[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as Item[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) return (data as { data: Item[] }).data;
  return [];
}

function label(item: Item) {
  if (typeof item.name === "string") return item.name;
  return item.name?.en ?? Object.values(item.name ?? {})[0] ?? `#${item.id}`;
}

export function PromotionWorkspace() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const allowed = useMemo(() => (user?.permissions ?? []).includes("promotions.manage"), [user?.permissions]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<Item[]>([]);
  const [classes, setClasses] = useState<Item[]>([]);
  const [currentYear, setCurrentYear] = useState("");
  const [nextYear, setNextYear] = useState("");
  const [classId, setClassId] = useState("");
  const [mode, setMode] = useState("annual");
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmCommit, setConfirmCommit] = useState(false);

  async function request(path: string, body?: unknown) {
    const response = await promotionService.request(path, body ? "POST" : "GET", body, user?.id);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { message?: string }).message ?? t("management.requestFailed"));
    return result as Record<string, unknown>;
  }

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    let active = true;
    void Promise.all([request("academic-years?per_page=100"), request("school-classes?per_page=100")])
      .then(([yearPayload, classPayload]) => {
        if (!active) return;
        const loadedYears = rows(yearPayload);
        setYears(loadedYears);
        setClasses(rows(classPayload));
        const current = loadedYears.find((year) => (year as Item & { is_current?: boolean }).is_current);
        if (current) setCurrentYear(String(current.id));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [allowed]);

  const payload = () => ({
    academic_year_id: Number(currentYear),
    target_academic_year_id: Number(nextYear),
    class_id: classId ? Number(classId) : undefined,
    evaluation_mode: mode,
  });

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!allowed || busy) return;
    setBusy(true); setError(""); setNotice("");
    try { setSimulation(await request("promotion/simulate", payload())); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("management.requestFailed")); }
    finally { setBusy(false); }
  };

  const commit = async () => {
    if (!allowed || busy || !simulation) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("promotion/commit", payload());
      setNotice((result.message as string) || t("management.promotionCommitted"));
      setSimulation(null);
      setConfirmCommit(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("management.requestFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) return null;
  if (loading && !years.length) return <PromotionsShimmerSkeleton />;

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 animate-in fade-in duration-200">
      <ConfirmDialog
        isOpen={confirmCommit}
        onClose={() => setConfirmCommit(false)}
        onConfirm={() => void commit()}
        isLoading={busy}
        title={t("management.commitPromotion")}
        description={t("management.confirmPromotion")}
      />
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{t("dashboard.groups.school")}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("dashboard.nav.promotions")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("management.promotionDescription")}</p>
      </header>
      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error || notice}
        </p>
      )}
      <form onSubmit={(event) => void run(event)} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          {t("management.currentAcademicYear")}
          <div className="mt-1.5">
            <AppSelect
              value={currentYear}
              onChange={(val) => setCurrentYear(val)}
              options={years.map((year) => ({ value: String(year.id), label: label(year) }))}
              placeholder={t("management.selectOption")}
              required
            />
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("management.nextAcademicYear")}
          <div className="mt-1.5">
            <AppSelect
              value={nextYear}
              onChange={(val) => setNextYear(val)}
              options={years.filter((year) => String(year.id) !== currentYear).map((year) => ({ value: String(year.id), label: label(year) }))}
              placeholder={t("management.selectOption")}
              required
            />
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("management.classOptional")}
          <div className="mt-1.5">
            <AppSelect
              value={classId}
              onChange={(val) => setClassId(val)}
              options={[
                { value: "", label: t("management.allClasses") },
                ...classes.map((item) => ({ value: String(item.id), label: label(item) })),
              ]}
              placeholder={t("management.allClasses")}
            />
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("management.evaluationMode")}
          <div className="mt-1.5">
            <AppSelect
              value={mode}
              onChange={(val) => setMode(val)}
              options={[
                { value: "annual", label: t("management.annual") },
                { value: "semester_1", label: t("management.semesterOne") },
                { value: "semester_2", label: t("management.semesterTwo") },
              ]}
              placeholder={t("management.annual")}
            />
          </div>
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy || !years.length || !currentYear || !nextYear || currentYear === nextYear}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            {busy ? t("administration.loading") : t("management.runPromotionSimulation")}
          </button>
        </div>
      </form>
      {simulation && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t("management.simulationResults")}</h2>
              <p className="text-sm text-slate-500">{t("management.simulationNoChanges")}</p>
            </div>
            <button
              onClick={() => setConfirmCommit(true)}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
            >
              <ArrowRightLeft className="h-4 w-4" />
              {t("management.commitPromotion")}
            </button>
          </div>
          <pre className="max-h-[28rem] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(simulation, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
