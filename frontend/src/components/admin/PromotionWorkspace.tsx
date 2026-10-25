"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { promotionService } from "@/services/promotion.service";

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
    const response = await promotionService.request(`/api/backend/${path}`, body ? "POST" : "GET", body, user?.id);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { message?: string }).message ?? t("management.requestFailed"));
    return result as Record<string, unknown>;
  }

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void Promise.all([request("academic-years?per_page=100"), request("school-classes?per_page=100")]).then(([yearPayload, classPayload]) => {
      if (!active) return;
      const loadedYears = rows(yearPayload); setYears(loadedYears); setClasses(rows(classPayload));
      const current = loadedYears.find((year) => (year as Item & { is_current?: boolean }).is_current);
      if (current) setCurrentYear(String(current.id));
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t("management.requestFailed")); });
    return () => { active = false; };
  }, [allowed]);

  const payload = () => ({ current_academic_year_id: Number(currentYear), next_academic_year_id: Number(nextYear), ...(classId ? { class_id: Number(classId) } : {}), evaluation_mode: mode });

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!allowed || busy || !currentYear || !nextYear || currentYear === nextYear) return;
    setBusy(true); setError(""); setNotice(""); setSimulation(null);
    try { const result = await request("promotion/dry-run", payload()); setSimulation(result.data as Simulation); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("management.requestFailed")); }
    finally { setBusy(false); }
  };

  const commit = async () => {
    if (!allowed || busy || !simulation) return;
    setBusy(true); setError(""); setNotice("");
    try { const result = await request("promotion/commit", payload()); setNotice((result.message as string) || t("management.promotionCommitted")); setSimulation(null); setConfirmCommit(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("management.requestFailed")); }
    finally { setBusy(false); }
  };

  if (!allowed) return null;
  return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
    <ConfirmDialog isOpen={confirmCommit} onClose={() => setConfirmCommit(false)} onConfirm={() => void commit()} isLoading={busy} title={t("management.commitPromotion")} description={t("management.confirmPromotion")} />
    <header><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{t("dashboard.groups.school")}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{t("dashboard.nav.promotions")}</h1><p className="mt-1 text-sm text-slate-600">{t("management.promotionDescription")}</p></header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    <form onSubmit={(event) => void run(event)} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">{t("management.currentAcademicYear")}<select required value={currentYear} onChange={(event) => setCurrentYear(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3">{years.map((year) => <option key={year.id} value={year.id}>{label(year)}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">{t("management.nextAcademicYear")}<select required value={nextYear} onChange={(event) => setNextYear(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3"><option value="">{t("management.selectOption")}</option>{years.filter((year) => String(year.id) !== currentYear).map((year) => <option key={year.id} value={year.id}>{label(year)}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">{t("management.classOptional")}<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3"><option value="">{t("management.allClasses")}</option>{classes.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">{t("management.evaluationMode")}<select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3"><option value="annual">{t("management.annual")}</option><option value="semester_1">{t("management.semesterOne")}</option><option value="semester_2">{t("management.semesterTwo")}</option></select></label>
      <div className="sm:col-span-2"><button disabled={busy || !years.length || !currentYear || !nextYear || currentYear === nextYear} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"><RefreshCw className="h-4 w-4" />{busy ? t("administration.loading") : t("management.runPromotionSimulation")}</button></div>
    </form>
    {simulation && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">{t("management.simulationResults")}</h2><p className="text-sm text-slate-500">{t("management.simulationNoChanges")}</p></div><button onClick={() => setConfirmCommit(true)} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"><ArrowRightLeft className="h-4 w-4" />{t("management.commitPromotion")}</button></div><pre className="max-h-[28rem] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">{JSON.stringify(simulation, null, 2)}</pre></section>}
  </main>;
}
