"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { TableShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
} from "lucide-react";
import {
  PaymentDashboardSummary,
  MemberMonthlyStatus,
  MemberPaymentRecord,
  SchoolClassSummary,
  PaymentReceiptData,
  PaginationMeta,
} from "@/types/auth";

export default function MemberPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

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

  // Rules Configuration Modal (Admin)
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [ruleNameEn, setRuleNameEn] = useState<string>("Standard Monthly Contribution");
  const [ruleNameAm, setRuleNameAm] = useState<string>("ወርሃዊ የአባላት መዋጮ");
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
        const res = await fetch("/api/backend/school-classes", {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          setClasses(Array.isArray(json?.data) ? json.data : []);
        }
      } catch {
        // Soft error
      }
    }
    if (user) {
      fetchClasses();
    }
  }, [user]);

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
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch dashboard metrics
      const dashPromise = fetch(`/api/backend/payments/dashboard?month=${selectedMonth}`, {
        headers: { Accept: "application/json" },
      });

      // 2. Fetch member payments ledger
      const params = new URLSearchParams();
      params.set("month", selectedMonth);
      params.set("page", String(page));
      params.set("per_page", "15");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterClassId) params.set("class_id", filterClassId);
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);

      const membersPromise = fetch(`/api/backend/payments/members?${params.toString()}`, {
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
        if (memJson.pagination) {
          setPagination(memJson.pagination);
        } else {
          setPagination(null);
        }
      } else {
        setError("Failed to load members payment ledger.");
      }
    } catch {
      setError("Network error while connecting to payment service.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth, currentPage, searchQuery, filterClassId, filterStatus]);

  useEffect(() => {
    if (user) {
      loadData(currentPage);
    }
  }, [user, selectedMonth, currentPage, loadData]);

  // Open Payment Entry Modal
  const openPaymentModal = (member: MemberMonthlyStatus) => {
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
    if (!payingMember || submittingPayment) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid payment amount greater than zero.");
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch("/api/backend/payments", {
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

        // Offer immediate receipt view
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
    setHistoryMember(member);
    setHistoryLoading(true);
    setMemberPayments([]);

    try {
      const res = await fetch(`/api/backend/payments/members/${member.member_id}?month=${selectedMonth}`, {
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
    try {
      const res = await fetch(`/api/backend/payments/${paymentId}/receipt`, {
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
    if (!paymentToVoid || voidingSubmitting) return;

    if (!voidReason.trim() || voidReason.trim().length < 5) {
      setVoidError("Void reason must be at least 5 characters.");
      return;
    }

    setVoidingSubmitting(true);
    setVoidError(null);

    try {
      const res = await fetch(`/api/backend/payments/${paymentToVoid.id}/void`, {
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
        // Refresh history & ledger
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
    if (submittingRule) return;

    const amt = parseFloat(ruleAmount);
    if (isNaN(amt) || amt < 0) {
      setRuleError("Please enter a valid contribution amount.");
      return;
    }

    setSubmittingRule(true);
    setRuleError(null);

    try {
      const res = await fetch("/api/backend/payments/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: {
            en: ruleNameEn.trim(),
            am: ruleNameAm.trim() || ruleNameEn.trim(),
          },
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

  // Format Helper
  const formatText = (text: any, fallback: string = "—"): string => {
    if (text === null || text === undefined || text === "") return fallback;
    if (typeof text === "string") return text;
    if (typeof text === "number") return String(text);
    if (typeof text === "object") {
      if (text.am && text.en) return text.am || text.en;
      if (text.am) return text.am;
      if (text.en) return text.en;
      const values = Object.values(text).filter((v) => typeof v === "string" || typeof v === "number");
      if (values.length > 0) return String(values[0]);
      return fallback;
    }
    return String(text);
  };

  const getStatusBadge = (status: MemberMonthlyStatus["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case "OVERPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5" />
            Credit / Overpaid
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Partial
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Unpaid
          </span>
        );
      case "EXEMPT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <UserCheck className="w-3.5 h-3.5" />
            Exempt / Minor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const financial = dashboardData?.financial_summary;
  const counts = dashboardData?.member_counts;
  const isAdmin = user?.role === "superadmin" || user?.role === "academic_director";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mr-2 text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-base text-slate-900 leading-tight">Monthly Member Payments</h1>
                  <p className="text-[11px] text-slate-500">የአባላት ወርሃዊ መዋጮ አስተዳደር</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Configure Rules</span>
                </button>
              )}

              <button
                onClick={() => loadData(currentPage)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Month Selector & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Billing Month:
            </span>
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
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
                className="bg-transparent text-sm font-bold text-slate-800 text-center px-2 py-0.5 focus:outline-hidden"
              />
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Active Rules:</span>
            <span className="font-semibold text-slate-800">
              {dashboardData?.active_rules?.length ? dashboardData.active_rules.map((r) => formatText(r.name)).join(", ") : "Standard Default (50 ETB / 18+)"}
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load payment data</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button onClick={() => loadData(currentPage)} className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-700">
              Retry
            </button>
          </div>
        )}

        {actionSuccess && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Transaction Completed</p>
              <p className="text-xs text-emerald-700 mt-0.5">{actionSuccess}</p>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Financial KPI Cards */}
        <section aria-labelledby="financial-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expected</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {financial ? `${financial.total_expected.toFixed(2)} ETB` : "—"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              From {counts?.eligible_members ?? 0} eligible paying members
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Collected</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {financial ? `${financial.total_collected.toFixed(2)} ETB` : "—"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {financial ? `${financial.collection_rate_percent.toFixed(1)}%` : "0%"}
              </span>
              <span className="text-[11px] text-slate-400">collection rate</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remaining Balance</p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {financial ? `${financial.total_remaining.toFixed(2)} ETB` : "—"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Across {(counts?.unpaid_members ?? 0) + (counts?.partial_members ?? 0)} members pending
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overpaid / Credit</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {financial ? `${financial.total_overpaid.toFixed(2)} ETB` : "—"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Excess contributions on credit
            </p>
          </div>
        </section>

        {/* Member Status Breakdown Pills */}
        {counts && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Fully Paid</span>
              <p className="text-lg font-bold text-emerald-600">{counts.paid_members}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Partially Paid</span>
              <p className="text-lg font-bold text-amber-600">{counts.partial_members}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Unpaid</span>
              <p className="text-lg font-bold text-rose-600">{counts.unpaid_members}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Overpaid</span>
              <p className="text-lg font-bold text-blue-600">{counts.overpaid_members}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Exempt (Minors)</span>
              <p className="text-lg font-bold text-slate-600">{counts.exempt_members}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Total Members</span>
              <p className="text-lg font-bold text-slate-900">{counts.total_members}</p>
            </div>
          </div>
        )}

        {/* Member Payment Ledger Section */}
        <section aria-labelledby="ledger-heading" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 id="ledger-heading" className="text-lg font-bold text-slate-900">
                  Member Payment Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Obligations and contributions for {selectedMonth}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Showing {members.length} members
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, code, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCurrentPage(1);
                      loadData(1);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={filterClassId}
                  onChange={(e) => {
                    setFilterClassId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {formatText(c.name)} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="OVERPAID">Overpaid (Credit)</option>
                  <option value="EXEMPT">Exempt / Minor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4 text-left">Member</th>
                  <th scope="col" className="py-3.5 px-4 text-left">Class & Age</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Expected</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Paid</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Balance</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-4">
                      <TableShimmerSkeleton rows={5} columns={7} />
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No member records found matching the current filters for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  members.map((mem) => (
                    <tr key={mem.member_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {mem.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-600">{mem.member_code}</span>
                          {mem.christian_name && <span>• {mem.christian_name}</span>}
                          {mem.phone_number && <span>• {mem.phone_number}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {mem.class_name || "Unassigned Class"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {mem.age !== null && mem.age !== undefined ? `${mem.age} yrs old` : "DOB Missing"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {mem.expected_amount.toFixed(2)} ETB
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {mem.paid_amount.toFixed(2)} ETB
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {mem.remaining_balance > 0 ? (
                          <span className="font-bold text-rose-600">
                            {mem.remaining_balance.toFixed(2)} ETB
                          </span>
                        ) : mem.overpaid_amount > 0 ? (
                          <span className="font-bold text-blue-600">
                            +{mem.overpaid_amount.toFixed(2)} Credit
                          </span>
                        ) : (
                          <span className="text-slate-400">0.00 ETB</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(mem.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openPaymentModal(mem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>

                          <button
                            onClick={() => openHistoryModal(mem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total members)
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={pagination.current_page >= pagination.total_pages}
                  className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Record Payment Modal */}
      {payingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Member Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Month: {selectedMonth}</p>
              </div>
              <button
                onClick={() => setPayingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {paymentError}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-bold text-slate-900">{payingMember.full_name} ({payingMember.member_code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <span className="font-semibold text-slate-800">{payingMember.class_name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected / Paid:</span>
                <span className="font-medium text-slate-800">
                  {payingMember.expected_amount.toFixed(2)} ETB / {payingMember.paid_amount.toFixed(2)} ETB
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Remaining Balance:</span>
                <span className={payingMember.remaining_balance > 0 ? "text-rose-600" : "text-emerald-600"}>
                  {payingMember.remaining_balance.toFixed(2)} ETB
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Cash (ጥሬ ገንዘብ)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (ባንክ ዝውውር)</option>
                  <option value="CHECK">Check (ቼክ)</option>
                  <option value="MOBILE_MONEY">Telebirr / Mobile Money</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference / Transaction No. (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. TXN-98421 or Bank Slip #"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid in person after service"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingMember(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingPayment ? "Recording..." : "Confirm & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History & Receipts Modal */}
      {historyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Payment History: {historyMember.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Member Code: {historyMember.member_code} • {historyMember.class_name || "Unassigned"}
                </p>
              </div>
              <button
                onClick={() => setHistoryMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {historyLoading ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Loading payment history...
                </div>
              ) : memberPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No payment transactions recorded for this member yet.
                </div>
              ) : (
                memberPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border ${
                      p.is_void ? "bg-rose-50/40 border-rose-200 opacity-75" : "bg-slate-50 border-slate-200"
                    } text-xs space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{p.receipt_number}</span>
                        {p.is_void ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            VOIDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            VALID
                          </span>
                        )}
                        <span className="text-slate-400">• {p.billing_month}</span>
                      </div>
                      <span className="font-bold text-sm text-slate-900">{p.amount.toFixed(2)} ETB</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <div>
                        <span>Method: {p.payment_method}</span>
                        {p.payment_reference && <span> • Ref: {p.payment_reference}</span>}
                        {p.recorded_by_user && <span> • Cashier: {formatText(p.recorded_by_user.name)}</span>}
                      </div>
                      <span>{new Date(p.paid_at).toLocaleDateString()}</span>
                    </div>

                    {p.is_void && (
                      <div className="p-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-[11px]">
                        <strong>Void Reason:</strong> {p.void_reason} (Voided on {p.voided_at})
                      </div>
                    )}

                    {!p.is_void && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60">
                        <button
                          onClick={() => fetchReceipt(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setPaymentToVoid(p);
                              setVoidReason("");
                              setVoidError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold"
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

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Payment Confirmation Modal */}
      {paymentToVoid && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <span>Void Payment Receipt</span>
              </h3>
              <button onClick={() => setPaymentToVoid(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Are you sure you want to void receipt <strong>#{paymentToVoid.receipt_number}</strong> for{" "}
              <strong>{paymentToVoid.amount.toFixed(2)} ETB</strong>? This action updates member balances and will be logged in the permanent audit trail.
            </p>

            {voidError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidPayment} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Voiding * (minimum 5 characters)
                </label>
                <textarea
                  rows={3}
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Payment recorded in duplicate or entered against wrong member account"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentToVoid(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidingSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {voidingSubmitting ? "Voiding..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Payment Receipt
              </span>
              <button onClick={() => setActiveReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Printable Card */}
            <div id="printable-receipt-card" className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-slate-200">
                <h4 className="text-base font-black text-slate-900 tracking-tight font-sans">
                  SIMPLE SENBET SUNDAY SCHOOL
                </h4>
                <p className="text-[11px] text-slate-500 font-sans">የሰንበት ትምህርት ቤት ወርሃዊ መዋጮ ደረሰኝ</p>
                <p className="mt-2 text-xs font-bold text-indigo-700">RECEIPT #{activeReceipt.receipt_number}</p>
                <p className="text-[10px] text-slate-400">Date: {new Date(activeReceipt.receipt_date).toLocaleString()}</p>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-bold text-slate-900 font-sans">{activeReceipt.member.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Code:</span>
                  <span>{activeReceipt.member.member_code}</span>
                </div>
                {activeReceipt.member.class_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class:</span>
                    <span>{activeReceipt.member.class_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Month:</span>
                  <span className="font-bold">{activeReceipt.billing_month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span>{activeReceipt.payment_method}</span>
                </div>
                {activeReceipt.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference:</span>
                    <span>{activeReceipt.payment_reference}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t-2 border-slate-300 space-y-1.5">
                <div className="flex justify-between text-sm font-black text-slate-900">
                  <span>AMOUNT PAID:</span>
                  <span>{activeReceipt.amount.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Total Paid for Month:</span>
                  <span>{activeReceipt.status.total_paid_for_month.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Remaining Month Balance:</span>
                  <span>{activeReceipt.status.remaining_balance.toFixed(2)} ETB</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans">
                Cashier: {formatText(activeReceipt.recorded_by?.name) || "System"} • Thank you for your faithful contribution!
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Payment Rules Modal (Admin) */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Monthly Payment Rule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define contribution rates, age limits, and class criteria</p>
              </div>
              <button onClick={() => setShowRuleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ruleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {ruleError}
              </div>
            )}

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rule Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleNameEn}
                    onChange={(e) => setRuleNameEn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rule Name (Amharic)
                  </label>
                  <input
                    type="text"
                    value={ruleNameAm}
                    onChange={(e) => setRuleNameAm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ruleAmount}
                    onChange={(e) => setRuleAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimum Age to Pay (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ruleMinAge}
                    onChange={(e) => setRuleMinAge(e.target.value)}
                    placeholder="Leave empty for all ages"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimum Grade/Class
                  </label>
                  <select
                    value={ruleMinClassId}
                    onChange={(e) => setRuleMinClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="">No minimum class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {formatText(c.name)} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Specific Target Class
                  </label>
                  <select
                    value={ruleTargetClassId}
                    onChange={(e) => setRuleTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="">Global (All Classes)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {formatText(c.name)} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Effective From Date *
                </label>
                <input
                  type="date"
                  required
                  value={ruleEffectiveFrom}
                  onChange={(e) => setRuleEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="carryForward"
                  checked={ruleCarryForward}
                  onChange={(e) => setRuleCarryForward(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="carryForward" className="font-semibold text-slate-700 cursor-pointer">
                  Allow excess payment credit to carry forward to future months
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRule}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingRule ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
