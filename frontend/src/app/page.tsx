"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Server, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CalendarCheck, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers
} from "lucide-react";

interface ApiStatus {
  status: string;
  app: string;
  framework: string;
  php_version: string;
  database: {
    connected: boolean;
    driver: string;
    database: string;
  };
  timestamp: string;
}

interface SenbetSummary {
  title: string;
  motto: string;
  modules: Array<{
    id: string;
    name: string;
    count?: number;
    rate?: string;
    description: string;
  }>;
  announcements: Array<{
    title: string;
    date: string;
    priority: string;
  }>;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [summary, setSummary] = useState<SenbetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, summaryRes] = await Promise.all([
        fetch(`${apiUrl}/api/status`).catch(() => null),
        fetch(`${apiUrl}/api/senbet/summary`).catch(() => null),
      ]);

      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        setApiStatus(statusData);
      } else {
        setApiStatus(null);
      }

      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to backend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getModuleIcon = (id: string) => {
    switch (id) {
      case "students":
        return <Users className="w-6 h-6 text-indigo-600" />;
      case "classes":
        return <GraduationCap className="w-6 h-6 text-emerald-600" />;
      case "courses":
        return <BookOpen className="w-6 h-6 text-amber-600" />;
      case "attendance":
        return <CalendarCheck className="w-6 h-6 text-rose-600" />;
      default:
        return <Layers className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Laravel 13 + Next.js 16 Monorepo
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple Senbet (ሰንበት ትምህርት ቤት)
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-1">
            Clean, decoupled Sunday school management system with unified architecture.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <span>Teacher & Admin Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={fetchData}
            disabled={loading}
            aria-label="Refresh Status"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Backend Integration Status Bar */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${apiStatus?.status === 'online' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <Server className={`w-6 h-6 ${apiStatus?.status === 'online' ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Laravel Backend API</span>
                {apiStatus?.status === "online" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <XCircle className="w-3.5 h-3.5" /> Standby (Run `php artisan serve`)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{apiUrl}/api/status</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-slate-400 block font-medium">Framework</span>
              <span className="font-semibold text-slate-800">{apiStatus?.framework || "Laravel 13"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Database</span>
              <div className="flex items-center gap-1 font-semibold text-slate-800">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                {apiStatus?.database.database || "simple_senbet"}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Next.js Client</span>
              <span className="font-semibold text-indigo-600">inside /frontend</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Overview Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">System Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(summary?.modules || [
            { id: "students", name: "ተማሪዎች (Students)", count: 128, description: "Student registration, roster, and spiritual progression." },
            { id: "classes", name: "ክፍሎች (Classes)", count: 8, description: "Age & grade based spiritual study classes." },
            { id: "courses", name: "ትምህርቶች (Courses)", count: 12, description: "Bible study, Church history, Mezmur, and Dogma." },
            { id: "attendance", name: "ክትትል (Attendance)", rate: "94%", description: "Sunday roll-call and participation tracking." },
          ]).map((mod) => (
            <div
              key={mod.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition">
                  {getModuleIcon(mod.id)}
                </div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {mod.count !== undefined ? mod.count : mod.rate}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{mod.name}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Launch Guide */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Quick Start Commands</h2>
          <p className="text-slate-400 text-sm mt-1">
            Run the Laravel backend API and the Next.js frontend application with simple commands:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>1. Laravel Backend (Root)</span>
              <span className="text-emerald-400">Port 8000</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto">
              php artisan serve
            </pre>
            <p className="text-xs text-slate-400">Serves API endpoints at http://127.0.0.1:8000</p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>2. Next.js Frontend (/frontend)</span>
              <span className="text-indigo-400">Port 3000</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
              cd frontend && npm run dev
            </pre>
            <p className="text-xs text-slate-400">Serves modern UI at http://localhost:3000</p>
          </div>
        </div>
      </section>
    </main>
  );
}
