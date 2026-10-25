import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9] py-16 px-5 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#d8ccb4] dark:border-slate-800 bg-white dark:bg-[#141a29] p-8 sm:p-12 shadow-xs space-y-6">
        <div className="border-b border-[#f0ebd9] dark:border-slate-800 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140] dark:text-[#fba81c]">
            የአገልግሎት ስምምነት | Terms of Service
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0f243e] dark:text-slate-100 mt-2">
            Institutional Terms of Service
          </h1>
          <p className="text-xs text-[#718292] dark:text-slate-400 mt-1">Simple Senbet Sunday School Management Platform</p>
        </div>

        <div className="space-y-4 text-sm leading-7 text-[#526475] dark:text-slate-400">
          <p>
            Simple Senbet is an administrative information platform operated in support of parish Sunday Schools
            (የሰንበት ትምህርት ቤቶች) within the Ethiopian Orthodox Tewahedo Church. By accessing or using this system,
            authorized personnel agree to adhere to church values, privacy obligations, and role-governed standards.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100 pt-2">1. Authorized User Credentials</h3>
          <p>
            Each user must sign in using their unique, administrator-issued credentials. User credentials must not
            be shared. Each user is responsible for all actions conducted under their authenticated session.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100 pt-2">2. Confidentiality of Student Records</h3>
          <p>
            Student profiles, attendance logs, spiritual milestones, and family contact details must be treated with
            strict confidentiality. Access is restricted strictly to assigned classes and administrative necessities.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] dark:text-slate-100 pt-2">3. Stewardship & Pastoral Integrity</h3>
          <p>
            Financial records, member rosters, and course evaluations must remain truthful, accurate, and aligned
            with the sacred mission of Christian education in the Church.
          </p>
        </div>

        <div className="pt-6 border-t border-[#f0ebd9] dark:border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7140] dark:text-[#fba81c] hover:text-[#0f243e] dark:hover:text-[#f59e0b]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
