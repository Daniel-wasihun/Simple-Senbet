"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { FinancePaymentsShimmerSkeleton, TableShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";
import { useRouter } from "next/navigation";
import { AdminModal } from "@/components/admin/AdminModal";
import { paymentsService } from "@/services/payments.service";
import { schoolManagementService } from "@/services/schoolManagement.service";
import {
  BRAND,
  btnBase,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputCls,
  textareaCls,
  labelCls,
  tableContainerCls,
  tableHeaderRowCls,
  tableHeaderCellCls,
  tableRowCls,
  actionBtnBase,
  actionBtnView,
  actionBtnDelete,
  modalStickyFooter,
  cardCls,
  detailCardCls,
  nestedLocalizedText,
} from "@/components/admin/adminUiTokens";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  RefreshCw,
  X,
  CreditCard,
  Ban,
  FileText,
  Sliders,
  Calendar,
  UserCheck,
  Download,
} from "lucide-react";
import {
  PaymentDashboardSummary,
  MemberMonthlyStatus,
  MemberPaymentRecord,
  SchoolClassSummary,
  PaymentReceiptData,
  PaginationMeta,
} from "@/types/auth";

export function MemberPaymentsDashboard({ area: _area }: { area: "finance" | "member" | "academic" | "attendance" | "overview" | "superadmin" }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const isSuperOrAdmin = useMemo(() => {
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    const roles = (user.roles || []).map((x: any) =>
      (typeof x === "string" ? x : x.name || "").toLowerCase()
    );
    const adminRoles = ["superadmin", "admin", "administrator", "finance_officer"];
    if (adminRoles.includes(r)) return true;
    return roles.some((x) => adminRoles.includes(x)) || Boolean(user.permissions?.includes("*"));
  }, [user]);

  const can = useCallback(
    (permission: string) => isSuperOrAdmin || permissions.has(permission) || permissions.has("*"),
    [isSuperOrAdmin, permissions]
  );
  const canViewPayments = can("payments.view");
  const canRecordPayments = can("payments.record") || can("payments.record.all");
  const canVoidPayments = can("payments.void");
  const canExportPayments = can("payments.export") || can("payments.export.all");
  const canManageRules = can("payments.rules");
  const paymentRequest = (path: string, options: RequestInit = {}) => paymentsService.request(path, options, undefined, user?.id);

  // Selected billing month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Dashboard Summary & Ledger State
  const [dashboardData, setDashboardData] = useState<PaymentDashboardSummary | null>(null);
  const [members, setMembers] = useState<MemberMonthlyStatus[]>([]);
  const [classes, setClasses] = useState<SchoolClassSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Modals state
  const [payingMember, setPayingMember] = useState<MemberMonthlyStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Member History Modal
  const [historyMember, setHistoryMember] = useState<MemberMonthlyStatus | null>(null);
  const [memberPayments, setMemberPayments] = useState<MemberPaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Void Modal
  const [paymentToVoid, setPaymentToVoid] = useState<MemberPaymentRecord | null>(null);
  const [voidReason, setVoidReason] = useState<string>("");
  const [voidingSubmitting, setVoidingSubmitting] = useState<boolean>(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // Printable Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);

  // Export Dropdown
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Rules Configuration Modal (Admin)
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [ruleName, setRuleName] = useState<Record<string, string>>({
    en: "Standard Monthly Contribution",
    am: "ወርሃዊ የአባላት መዋጮ",
    om: "Buusii Ji’aa Idilee",
  });
  const [ruleEntryLanguage, setRuleEntryLanguage] = useState<SupportedLocale>("en");
  const [ruleAmount, setRuleAmount] = useState<string>("50.00");
  const [ruleMinAge, setRuleMinAge] = useState<string>("18");
  const [ruleMinClassId, setRuleMinClassId] = useState<string>("");
  const [ruleTargetClassId, setRuleTargetClassId] = useState<string>("");
  const [ruleEffectiveFrom, setRuleEffectiveFrom] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [ruleCarryForward, setRuleCarryForward] = useState<boolean>(true);
  const [submittingRule, setSubmittingRule] = useState<boolean>(false);
  const [ruleError, setRuleError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load Classes for filtering
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await schoolManagementService.request("school-classes", {
          headers: { Accept: "application/json" },
        }, undefined, user?.id);
        if (res.ok) {
          const json = await res.json();
          setClasses(Array.isArray(json?.data) ? json.data : []);
        }
      } catch {
        // Soft error
      }
    }
    if (user && canViewPayments && can("school-classes.view")) {
      fetchClasses();
    }
  }, [user, canViewPayments, permissions]);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const next = new Date(y, m, 1);
    setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setCurrentPage(1);
  };

  // Fetch Dashboard & Member Ledger Data
  const loadData = useCallback(async (page = currentPage) => {
    if (!user || !canViewPayments) return;
    setLoading(true);
    setError(null);

    try {
      const dashPromise = paymentRequest(`/api/backend/payments/dashboard?month=${selectedMonth}`, {
        headers: { Accept: "application/json" },
      });

      const params = new URLSearchParams();
      params.set("month", selectedMonth);
      params.set("page", String(page));
      params.set("per_page", "15");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterClassId) params.set("class_id", filterClassId);
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);

      const membersPromise = paymentRequest(`/api/backend/payments/members?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });

      const [dashRes, membersRes] = await Promise.all([dashPromise, membersPromise]);

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        setDashboardData(dashJson.data || null);
      } else {
        setError("Failed to load payment reconciliation summary.");
      }

      if (membersRes.ok) {
        const memJson = await membersRes.json();
        setMembers(Array.isArray(memJson.data) ? memJson.data : []);
        setPagination(memJson.pagination || null);
      } else {
        setError("Failed to load members payment ledger.");
      }
    } catch {
      setError("Network error while connecting to payment service.");
    } finally {
      setLoading(false);
    }
  }, [user, canViewPayments, selectedMonth, currentPage, searchQuery, filterClassId, filterStatus]);

  useEffect(() => {
    if (user) {
      loadData(currentPage);
    }
  }, [user, selectedMonth, currentPage, loadData]);

  // Open Payment Entry Modal
  const openPaymentModal = (member: MemberMonthlyStatus) => {
    if (!canRecordPayments) return;
    setPayingMember(member);
    const initialAmount = member.remaining_balance > 0 ? String(member.remaining_balance) : "";
    setPaymentAmount(initialAmount);
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentError(null);
  };

  // Submit Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordPayments || !payingMember || submittingPayment) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid payment amount greater than zero.");
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await paymentRequest("/api/backend/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          member_id: payingMember.member_id,
          billing_month: selectedMonth,
          amount: amt,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || null,
          notes: paymentNotes.trim() || null,
          idempotency_key: `client-${payingMember.member_id}-${selectedMonth}-${Date.now()}`,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionSuccess(`Payment of ${amt.toFixed(2)} Birr recorded for ${payingMember.full_name}. Receipt #${json?.data?.receipt_number}`);
        setPayingMember(null);
        await loadData(currentPage);

        if (json?.data?.id) {
          fetchReceipt(json.data.id);
        }
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to record payment.";
        setPaymentError(msg);
      }
    } catch {
      setPaymentError("Network error while recording payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Open Member Payment History
  const openHistoryModal = async (member: MemberMonthlyStatus) => {
    if (!canViewPayments) return;
    setHistoryMember(member);
    setHistoryLoading(true);
    setMemberPayments([]);

    try {
      const res = await paymentRequest(`/api/backend/payments/members/${member.member_id}?month=${selectedMonth}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        setMemberPayments(Array.isArray(json?.data?.payments) ? json.data.payments : []);
      }
    } catch {
      // Soft error
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Printable Receipt
  const fetchReceipt = async (paymentId: number) => {
    if (!canViewPayments) return;
    try {
      const res = await paymentRequest(`/api/backend/payments/${paymentId}/receipt`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        setActiveReceipt(json.data);
      }
    } catch {
      // Soft error
    }
  };

  // Void Payment
  const handleVoidPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVoidPayments || !paymentToVoid || voidingSubmitting) return;

    if (!voidReason.trim() || voidReason.trim().length < 5) {
      setVoidError("Void reason must be at least 5 characters.");
      return;
    }

    setVoidingSubmitting(true);
    setVoidError(null);

    try {
      const res = await paymentRequest(`/api/backend/payments/${paymentToVoid.id}/void`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          reason: voidReason.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionSuccess(`Payment receipt #${paymentToVoid.receipt_number} has been voided.`);
        setPaymentToVoid(null);
        setVoidReason("");
        if (historyMember) {
          openHistoryModal(historyMember);
        }
        await loadData(currentPage);
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to void payment.";
        setVoidError(msg);
      }
    } catch {
      setVoidError("Network error while voiding payment.");
    } finally {
      setVoidingSubmitting(false);
    }
  };

  // Configure / Store Payment Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRules || submittingRule) return;

    const enName = ruleName.en?.trim() || ruleName.am?.trim() || ruleName.om?.trim();
    if (!enName) {
      setRuleError("Rule name is required in at least one language.");
      return;
    }

    const amt = parseFloat(ruleAmount);
    if (isNaN(amt) || amt < 0) {
      setRuleError("Please enter a valid contribution amount.");
      return;
    }

    setSubmittingRule(true);
    setRuleError(null);

    try {
      const cleanName: Record<string, string> = { en: enName };
      if (ruleName.am?.trim()) cleanName.am = ruleName.am.trim();
      if (ruleName.om?.trim()) cleanName.om = ruleName.om.trim();

      const res = await paymentRequest("/api/backend/payments/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          amount: amt,
          minimum_age: ruleMinAge ? parseInt(ruleMinAge, 10) : null,
          minimum_class_id: ruleMinClassId ? parseInt(ruleMinClassId, 10) : null,
          target_class_id: ruleTargetClassId ? parseInt(ruleTargetClassId, 10) : null,
          effective_from: ruleEffectiveFrom,
          carry_forward_credit: ruleCarryForward,
          is_active: true,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionSuccess(`Monthly payment rule created successfully.`);
        setShowRuleModal(false);
        await loadData(currentPage);
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to save rule.";
        setRuleError(msg);
      }
    } catch {
      setRuleError("Network error while creating rule.");
    } finally {
      setSubmittingRule(false);
    }
  };

  const getStatusBadge = (status: MemberMonthlyStatus["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case "OVERPAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <TrendingUp className="w-3 h-3" />
            Credit
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Partial
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Unpaid
          </span>
        );
      case "EXEMPT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-3 h-3" />
            Exempt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {status}
          </span>
        );
    }
  };

  if (!canViewPayments) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to view financial payments and ledger records.
      </section>
    );
  }

  if (authLoading || (loading && !dashboardData && !members.length)) {
    return <FinancePaymentsShimmerSkeleton />;
  }

  const financial = dashboardData?.financial_summary;
  const counts = dashboardData?.member_counts;

  return (
    <div className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              Financial Management
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              የአባላት ወርሃዊ መዋጮ
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-[#0858a8] shrink-0" />
            Monthly Member Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track member obligations, record contributions, and configure payment rules.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Billing Month Navigation */}
          <div className="inline-flex items-center rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 text-center px-2 py-0.5 focus:outline-hidden"
            />
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {canManageRules && (
            <button
              onClick={() => setShowRuleModal(true)}
              className={btnSecondary}
              title="Configure Monthly Contribution Rules"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Configure Rules</span>
            </button>
          )}

          {canExportPayments && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={btnSecondary}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-52 rounded-[4px] bg-white dark:bg-[#141a29] border border-slate-200/90 dark:border-slate-800 shadow-xl py-1 z-40 text-xs">
                  <a
                    href={`/api/backend/payments/export/monthly-summary?month=${selectedMonth}${filterClassId ? `&class_id=${filterClassId}` : ""}`}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Monthly Summary CSV</span>
                  </a>
                  <a
                    href={`/api/backend/payments/export/transactions?month=${selectedMonth}${filterClassId ? `&class_id=${filterClassId}` : ""}`}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Transactions Detail CSV</span>
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => loadData(currentPage)}
            disabled={loading}
            className={btnSecondary}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0858a8]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div role="alert" className="p-3.5 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load payment data</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button onClick={() => loadData(currentPage)} className={`${btnSecondary} h-7 px-2.5 text-xs text-rose-700 dark:text-rose-300`}>
            Retry
          </button>
        </div>
      )}

      {actionSuccess && (
        <div role="status" className="p-3.5 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Transaction Completed</p>
            <p className="mt-0.5">{actionSuccess}</p>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* Financial KPI Cards */}
      <section aria-labelledby="financial-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expected</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {financial ? `${financial.total_expected.toFixed(2)} ETB` : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0858a8] dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            From {counts?.eligible_members ?? 0} eligible paying members
          </p>
        </div>

        <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {financial ? `${financial.total_collected.toFixed(2)} ETB` : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-[3px]">
              {financial ? `${financial.collection_rate_percent.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">collection rate</span>
          </div>
        </div>

        <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining Balance</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {financial ? `${financial.total_remaining.toFixed(2)} ETB` : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-[4px] bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Across {(counts?.unpaid_members ?? 0) + (counts?.partial_members ?? 0)} pending members
          </p>
        </div>

        <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overpaid / Credit</p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {financial ? `${financial.total_overpaid.toFixed(2)} ETB` : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Excess contributions on credit
          </p>
        </div>
      </section>

      {/* Member Status Breakdown Quick Strip */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Fully Paid</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{counts.paid_members}</p>
          </div>
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Partially Paid</span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">{counts.partial_members}</p>
          </div>
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Unpaid</span>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">{counts.unpaid_members}</p>
          </div>
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Overpaid</span>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">{counts.overpaid_members}</p>
          </div>
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Exempt (Minors)</span>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">{counts.exempt_members}</p>
          </div>
          <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Members</span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">{counts.total_members}</p>
          </div>
        </div>
      )}

      {/* Member Payment Ledger Container */}
      <div className={tableContainerCls}>
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search member name, code, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    loadData(1);
                  }
                }}
                className={`${inputCls()} pl-8`}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Class Filter */}
            <div className="w-full sm:w-48">
              <AppSelect
                value={filterClassId}
                onChange={(val) => {
                  setFilterClassId(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map((c) => ({ value: String(c.id), label: `${nestedLocalizedText(c.name)} (${c.code})` })),
                ]}
                placeholder="All Classes"
                size="sm"
                ariaLabel="Filter by Class"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <AppSelect
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "PAID", label: "Paid in Full" },
                  { value: "PARTIAL", label: "Partially Paid" },
                  { value: "UNPAID", label: "Unpaid" },
                  { value: "OVERPAID", label: "Overpaid (Credit)" },
                  { value: "EXEMPT", label: "Exempt / Minor" },
                ]}
                placeholder="All Statuses"
                size="sm"
                ariaLabel="Filter by Payment Status"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap self-end md:self-center">
            {members.length} members shown
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderRowCls}>
                <th scope="col" className={tableHeaderCellCls}>Member</th>
                <th scope="col" className={tableHeaderCellCls}>Class & Age</th>
                <th scope="col" className={`${tableHeaderCellCls} text-right`}>Expected</th>
                <th scope="col" className={`${tableHeaderCellCls} text-right`}>Paid</th>
                <th scope="col" className={`${tableHeaderCellCls} text-right`}>Balance</th>
                <th scope="col" className={`${tableHeaderCellCls} text-center`}>Status</th>
                <th scope="col" className={`${tableHeaderCellCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <TableShimmerSkeleton rows={6} columns={7} />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No member records found matching the current filters for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                members.map((mem) => (
                  <tr key={mem.member_id} className={tableRowCls(false)}>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {mem.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[#0858a8] dark:text-sky-400">{mem.member_code}</span>
                        {mem.christian_name && <span>• {mem.christian_name}</span>}
                        {mem.phone_number && <span>• {mem.phone_number}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {mem.class_name || "Unassigned Class"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mem.age !== null && mem.age !== undefined ? `${mem.age} yrs old` : "DOB Missing"}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {mem.expected_amount.toFixed(2)} ETB
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {mem.paid_amount.toFixed(2)} ETB
                    </td>

                    <td className="py-3 px-4 text-right">
                      {mem.remaining_balance > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {mem.remaining_balance.toFixed(2)} ETB
                        </span>
                      ) : mem.overpaid_amount > 0 ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          +{mem.overpaid_amount.toFixed(2)} Credit
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">0.00 ETB</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(mem.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canRecordPayments && (
                          <button
                            onClick={() => openPaymentModal(mem)}
                            className={`${btnBase} h-7 px-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]`}
                            title="Record Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => openHistoryModal(mem)}
                          className={actionBtnView}
                          title="View Payment History"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.total_pages > 1 && (
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div>
              Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total members)
            </div>
            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                className={btnSecondary}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={pagination.current_page >= pagination.total_pages}
                className={btnSecondary}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {payingMember && canRecordPayments && (
        <AdminModal
          open={Boolean(payingMember && canRecordPayments)}
          onOpenChange={(open) => {
            if (!open && !submittingPayment) setPayingMember(null);
          }}
          title="Record Member Payment"
          description={`Record contribution for ${payingMember.full_name} (${payingMember.member_code}) · ${selectedMonth}`}
          size="md"
          showHeader={true}
        >
          <div className="space-y-4">
            {paymentError && (
              <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200">
                {paymentError}
              </div>
            )}

            <div className={detailCardCls}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Member</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{payingMember.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Class</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{payingMember.class_name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Expected / Paid</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {payingMember.expected_amount.toFixed(2)} ETB / {payingMember.paid_amount.toFixed(2)} ETB
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Remaining Balance</span>
                  <span className={`font-bold ${payingMember.remaining_balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {payingMember.remaining_balance.toFixed(2)} ETB
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>
                  Payment Amount (ETB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val)}
                  options={[
                    { value: "CASH", label: "Cash (ጥሬ ገንዘብ)" },
                    { value: "BANK_TRANSFER", label: "Bank Transfer (ባንክ ዝውውር)" },
                    { value: "CHECK", label: "Check (ቼክ)" },
                    { value: "MOBILE_MONEY", label: "Telebirr / Mobile Money" },
                    { value: "OTHER", label: "Other" },
                  ]}
                  placeholder="Select payment method"
                />
              </div>

              <div>
                <label className={labelCls}>Reference / Transaction No. (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. TXN-98421 or Bank Slip #"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className={labelCls}>Internal Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid in person after service"
                  className={inputCls()}
                />
              </div>

              <div className={modalStickyFooter}>
                <button
                  type="button"
                  onClick={() => setPayingMember(null)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className={btnPrimary}
                >
                  {submittingPayment ? "Recording..." : "Confirm & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </AdminModal>
      )}

      {/* Payment History & Receipts Modal */}
      {historyMember && (
        <AdminModal
          open={Boolean(historyMember)}
          onOpenChange={(open) => {
            if (!open) setHistoryMember(null);
          }}
          title={`Payment History: ${historyMember.full_name}`}
          description={`Member Code: ${historyMember.member_code} • ${historyMember.class_name || "Unassigned"}`}
          size="xl"
          showHeader={true}
        >
          <div className="space-y-3.5">
            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {historyLoading ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  Loading payment history...
                </div>
              ) : memberPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No payment transactions recorded for this member yet.
                </div>
              ) : (
                memberPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-[4px] border ${
                      p.is_void
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 opacity-80"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                    } text-xs space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{p.receipt_number}</span>
                        {p.is_void ? (
                          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            VOIDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            VALID
                          </span>
                        )}
                        <span className="text-slate-400">• {p.billing_month}</span>
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.amount.toFixed(2)} ETB</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <div>
                        <span>Method: {p.payment_method}</span>
                        {p.payment_reference && <span> • Ref: {p.payment_reference}</span>}
                        {p.recorded_by_user && <span> • Cashier: {nestedLocalizedText(p.recorded_by_user.name)}</span>}
                      </div>
                      <span>{new Date(p.paid_at).toLocaleDateString()}</span>
                    </div>

                    {p.is_void && (
                      <div className="p-2 rounded-[4px] bg-white dark:bg-[#111624] border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px]">
                        <strong>Void Reason:</strong> {p.void_reason} (Voided on {p.voided_at})
                      </div>
                    )}

                    {!p.is_void && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          onClick={() => fetchReceipt(p.id)}
                          className={btnSecondary}
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                          <span>Receipt</span>
                        </button>

                        {canVoidPayments && (
                          <button
                            onClick={() => {
                              setPaymentToVoid(p);
                              setVoidReason("");
                              setVoidError(null);
                            }}
                            className={btnDanger}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Void</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className={modalStickyFooter}>
              <button
                onClick={() => setHistoryMember(null)}
                className={btnSecondary}
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Void Payment Confirmation Modal */}
      {paymentToVoid && canVoidPayments && (
        <AdminModal
          open={Boolean(paymentToVoid && canVoidPayments)}
          onOpenChange={(open) => {
            if (!open && !voidingSubmitting) setPaymentToVoid(null);
          }}
          title="Void Payment Receipt"
          description={`Receipt #${paymentToVoid.receipt_number} · ${paymentToVoid.amount.toFixed(2)} ETB`}
          size="md"
          showHeader={true}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to void receipt <strong>#{paymentToVoid.receipt_number}</strong> for{" "}
              <strong>{paymentToVoid.amount.toFixed(2)} ETB</strong>? This action updates member balances and will be logged in the permanent audit trail.
            </p>

            {voidError && (
              <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidPayment} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Reason for Voiding <span className="text-rose-500">*</span> (minimum 5 characters)
                </label>
                <textarea
                  rows={3}
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Payment recorded in duplicate or entered against wrong member account"
                  className={textareaCls()}
                />
              </div>

              <div className={modalStickyFooter}>
                <button
                  type="button"
                  onClick={() => setPaymentToVoid(null)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidingSubmitting}
                  className={btnDanger}
                >
                  {voidingSubmitting ? "Voiding..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </AdminModal>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <AdminModal
          open={Boolean(activeReceipt)}
          onOpenChange={(open) => {
            if (!open) setActiveReceipt(null);
          }}
          title="Official Payment Receipt"
          description={`Receipt #${activeReceipt.receipt_number}`}
          size="lg"
          showHeader={true}
        >
          <div className="space-y-4">
            {/* Receipt Printable Card */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-receipt-card, #printable-receipt-card * {
                  visibility: visible !important;
                }
                #printable-receipt-card {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 550px !important;
                  margin: 0 auto !important;
                  border: 1px solid #cbd5e1 !important;
                  background: #ffffff !important;
                  color: #0f172a !important;
                  box-shadow: none !important;
                  padding: 24px !important;
                }
              }
            ` }} />
            <div id="printable-receipt-card" className="p-6 rounded-[6px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sans">
                  SIMPLE SENBET SUNDAY SCHOOL
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">የሰንበት ትምህርት ቤት ወርሃዊ መዋጮ ደረሰኝ</p>
                <p className="mt-2 text-xs font-bold text-[#0858a8] dark:text-sky-400">RECEIPT #{activeReceipt.receipt_number}</p>
                <p className="text-[10px] text-slate-400">Date: {new Date(activeReceipt.receipt_date).toLocaleString()}</p>
                {activeReceipt.payment_date_eth && (
                  <p className="text-[11px] font-sans font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    ቀን: {activeReceipt.payment_date_eth.formatted_am} ({activeReceipt.payment_date_eth.formatted_en})
                  </p>
                )}
              </div>

              {activeReceipt.is_void && (
                <div className="py-2 px-3 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-[4px] text-rose-800 dark:text-rose-200 font-bold tracking-wider text-xs">
                  ⚠️ VOIDED RECEIPT {activeReceipt.void_reason ? `— ${activeReceipt.void_reason}` : ""}
                </div>
              )}

              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Member:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-sans">{nestedLocalizedText(activeReceipt.member.full_name)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Member Code:</span>
                  <span>{activeReceipt.member.member_code}</span>
                </div>
                {activeReceipt.member.class_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Class:</span>
                    <span>{activeReceipt.member.class_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Billing Month:</span>
                  <span className="font-bold">
                    {activeReceipt.billing_month}
                    {activeReceipt.billing_month_eth && (
                      <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] ml-1.5">
                        ({activeReceipt.billing_month_eth.formatted_am})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                  <span>{activeReceipt.payment_method}</span>
                </div>
                {activeReceipt.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Reference:</span>
                    <span>{activeReceipt.payment_reference}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100">
                  <span>AMOUNT PAID:</span>
                  <span>{activeReceipt.amount.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Total Paid for Month:</span>
                  <span>{activeReceipt.status.total_paid_for_month.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Remaining Month Balance:</span>
                  <span>{activeReceipt.status.remaining_balance.toFixed(2)} ETB</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-[10px] text-slate-400 font-sans">
                Cashier: {nestedLocalizedText(activeReceipt.recorded_by?.name) || "System"} • Thank you for your faithful contribution!
              </div>
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className={btnSecondary}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={btnPrimary}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Configure Payment Rules Modal (Admin) */}
      {showRuleModal && canManageRules && (
        <AdminModal
          open={Boolean(showRuleModal && canManageRules)}
          onOpenChange={(open) => {
            if (!open && !submittingRule) setShowRuleModal(false);
          }}
          title="Configure Monthly Payment Rule"
          description="Define contribution rates, age limits, and class criteria"
          size="lg"
          showHeader={true}
          headerAction={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Language:
              </span>
              <div className="w-40">
                <AppSelect
                  value={ruleEntryLanguage}
                  onChange={(val) => setRuleEntryLanguage(val as SupportedLocale)}
                  options={[
                    { value: "en", label: "English" },
                    { value: "am", label: "አማርኛ" },
                    { value: "om", label: "Afaan Oromoo" },
                  ]}
                  size="sm"
                  ariaLabel="Payment rule language"
                />
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {ruleError && (
              <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200">
                {ruleError}
              </div>
            )}

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <LocalizedFieldInput
                label="Rule Name"
                value={ruleName}
                onChange={setRuleName}
                activeLocale={ruleEntryLanguage}
                onLocaleChange={setRuleEntryLanguage}
                required={true}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Monthly Amount (ETB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ruleAmount}
                    onChange={(e) => setRuleAmount(e.target.value)}
                    className={`${inputCls()} font-bold`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Minimum Age to Pay (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleMinAge}
                    onChange={(e) => setRuleMinAge(e.target.value)}
                    placeholder="Leave empty for all ages"
                    className={inputCls()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Minimum Grade/Class</label>
                  <AppSelect
                    value={ruleMinClassId}
                    onChange={(val) => setRuleMinClassId(val)}
                    options={[
                      { value: "", label: "No minimum class" },
                      ...classes.map((c) => ({ value: String(c.id), label: `${nestedLocalizedText(c.name)} (${c.code})` })),
                    ]}
                    placeholder="No minimum class"
                  />
                </div>
                <div>
                  <label className={labelCls}>Specific Target Class</label>
                  <AppSelect
                    value={ruleTargetClassId}
                    onChange={(val) => setRuleTargetClassId(val)}
                    options={[
                      { value: "", label: "Global (All Classes)" },
                      ...classes.map((c) => ({ value: String(c.id), label: `${nestedLocalizedText(c.name)} (${c.code})` })),
                    ]}
                    placeholder="Global (All Classes)"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Effective From Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={ruleEffectiveFrom}
                  onChange={(e) => setRuleEffectiveFrom(e.target.value)}
                  className={inputCls()}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="carryForward"
                  checked={ruleCarryForward}
                  onChange={(e) => setRuleCarryForward(e.target.checked)}
                  className="w-4 h-4 text-[#0858a8] rounded-[2px] border-slate-300 dark:border-slate-700 focus:ring-[#0858a8]"
                />
                <label htmlFor="carryForward" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Allow excess payment credit to carry forward to future months
                </label>
              </div>

              <div className={modalStickyFooter}>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRule}
                  className={btnPrimary}
                >
                  {submittingRule ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default MemberPaymentsDashboard;
