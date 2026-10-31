"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CheckSquare, Play, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { promotionService } from "@/services/promotion.service";
import { AppSelect } from "@/components/ui/AppSelect";
import { PromotionsShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { toast } from "sonner";
import {
  btnBase,
  btnDanger,
  btnPrimary,
  btnSecondary,
  cardCls,
  inputCls,
  labelCls,
  tableContainerCls,
  tableHeaderCellCls,
  tableHeaderRowCls,
  tableRowCls,
  nestedLocalizedText,
} from "@/components/admin/adminUiTokens";

type Item = { id: number; name?: string | Record<string, string> };
type Simulation = Record<string, unknown>;

function rows(payload: unknown): Item[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as Item[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Item[] }).data;
  }
  return [];
}

function label(item: Item) {
  if (typeof item.name === "string") return item.name;
  return item.name?.en ?? Object.values(item.name ?? {})[0] ?? `#${item.id}`;
}

export function PromotionWorkspace() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const allowed = useMemo(
    () => (user?.permissions ?? []).includes("promotions.manage") || user?.role === "superadmin",
    [user?.permissions, user?.role]
  );

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
  const [confirmCommit, setConfirmCommit] = useState(false);

  async function request(path: string, body?: unknown) {
    const response = await promotionService.request(path, body ? "POST" : "GET", body, user?.id);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { message?: string }).message ?? t("management.requestFailed"));
    return result as Record<string, unknown>;
  }

  const loadData = () => {
    setLoading(true);
    Promise.all([request("academic-years?per_page=100"), request("school-classes?per_page=100")])
      .then(([yearPayload, classPayload]) => {
        const loadedYears = rows(yearPayload);
        setYears(loadedYears);
        setClasses(rows(classPayload));
        const current = loadedYears.find((year) => (year as Item & { is_current?: boolean }).is_current);
        if (current) setCurrentYear(String(current.id));
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load academic data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    loadData();
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
    setBusy(true);
    setError("");
    try {
      const res = await request("promotion/simulate", payload());
      setSimulation(res);
      toast.success("Promotion simulation completed.");
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : t("management.requestFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!allowed || busy || !simulation) return;
    setBusy(true);
    setError("");
    try {
      const result = await request("promotion/commit", payload());
      toast.success((result.message as string) || "Promotions successfully committed.");
      setSimulation(null);
      setConfirmCommit(false);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : t("management.requestFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Extract simulated member list if structured array exists
  const simulatedMembers = useMemo(() => {
    if (!simulation) return [];
    if (Array.isArray(simulation.data)) return simulation.data as Array<Record<string, unknown>>;
    if (Array.isArray(simulation.promotions)) return simulation.promotions as Array<Record<string, unknown>>;
    if (Array.isArray(simulation.results)) return simulation.results as Array<Record<string, unknown>>;
    return [];
  }, [simulation]);

  if (!allowed) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to manage student promotions.
      </section>
    );
  }

  if (loading && !years.length) return <PromotionsShimmerSkeleton />;

  return (
    <main className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            Academic Progression
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Student Class Promotions
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Simulate and commit grade progression between academic years based on passing criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading || busy}
            className={btnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy || loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* ─── Simulation Configuration Form ────────────────────────────── */}
      <form onSubmit={(e) => void run(e)} className={cardCls}>
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Promotion Parameters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure the source and target academic cycles to preview progression before committing.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-[4px] border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>
              Source Academic Year <span className="text-rose-500">*</span>
            </label>
            <AppSelect
              value={currentYear}
              onChange={(val) => setCurrentYear(val)}
              options={years.map((year) => ({ value: String(year.id), label: label(year) }))}
              placeholder="Select current year"
              required
            />
          </div>

          <div>
            <label className={labelCls}>
              Target Academic Year <span className="text-rose-500">*</span>
            </label>
            <AppSelect
              value={nextYear}
              onChange={(val) => setNextYear(val)}
              options={years
                .filter((year) => String(year.id) !== currentYear)
                .map((year) => ({ value: String(year.id), label: label(year) }))}
              placeholder="Select target year"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Source Class (Optional)</label>
            <AppSelect
              value={classId}
              onChange={(val) => setClassId(val)}
              options={[
                { value: "", label: "All Classes" },
                ...classes.map((item) => ({ value: String(item.id), label: label(item) })),
              ]}
              placeholder="All Classes"
            />
          </div>

          <div>
            <label className={labelCls}>Evaluation Mode</label>
            <AppSelect
              value={mode}
              onChange={(val) => setMode(val)}
              options={[
                { value: "annual", label: "Annual Evaluation" },
                { value: "semester_1", label: "Semester 1 Evaluation" },
                { value: "semester_2", label: "Semester 2 Evaluation" },
              ]}
              placeholder="Annual"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={busy || !years.length || !currentYear || !nextYear || currentYear === nextYear}
            className={btnPrimary}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{busy ? "Simulating…" : "Run Promotion Simulation"}</span>
          </button>
        </div>
      </form>

      {/* ─── Simulation Results View ──────────────────────────────────── */}
      {simulation && (
        <section className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Simulation Preview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review computed promotions and student eligibility before applying changes to live records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmCommit(true)}
              disabled={busy}
              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-600`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Commit Promotions to Database</span>
            </button>
          </div>

          {simulatedMembers.length > 0 ? (
            <div className={tableContainerCls}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className={tableHeaderRowCls}>
                    <tr>
                      <th className={tableHeaderCellCls}>Student Member</th>
                      <th className={tableHeaderCellCls}>Current Class</th>
                      <th className={tableHeaderCellCls}>Average Score</th>
                      <th className={tableHeaderCellCls}>Eligibility Status</th>
                      <th className={tableHeaderCellCls}>Target Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {simulatedMembers.map((m, idx) => {
                      const isPromoted = Boolean(m.is_promoted ?? m.promoted ?? (Number(m.score ?? 0) >= 50));
                      return (
                        <tr key={idx} className={tableRowCls(false)}>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {String(m.member_name ?? m.name ?? m.member_id ?? `Student #${idx + 1}`)}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {String(m.current_class_name ?? m.class_name ?? m.class_id ?? "—")}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {m.score !== undefined ? `${Number(m.score).toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded-[3px] px-2 py-0.5 text-xs font-semibold ${
                                isPromoted
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                              }`}
                            >
                              {isPromoted ? "Promoted" : "Retained / Ineligible"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-200">
                            {String(m.target_class_name ?? m.next_class_name ?? "—")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-[4px] border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4">
              <pre className="max-h-[22rem] overflow-auto text-xs font-mono text-slate-700 dark:text-slate-300">
                {JSON.stringify(simulation, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* ─── Commit Confirmation Dialog ───────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmCommit}
        onClose={() => setConfirmCommit(false)}
        onConfirm={() => void commit()}
        isLoading={busy}
        title="Commit Student Promotions"
        description="Are you sure you want to finalize these student promotions? This will advance enrolled members to their respective target classes in the database."
        icon={<CheckSquare className="h-5 w-5 text-emerald-600" />}
        variant="primary"
      />
    </main>
  );
}
