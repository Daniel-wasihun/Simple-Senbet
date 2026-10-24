import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#fcfaf5] py-16 px-5 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#d8ccb4] bg-white p-8 sm:p-12 shadow-sm space-y-6">
        <div className="border-b border-[#f0ebd9] pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c7140]">
            የግላዊነት መመሪያ | Privacy Policy
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0f243e] mt-2">
            Parish Privacy Policy
          </h1>
          <p className="text-xs text-[#718292] mt-1">Simple Senbet Sunday School Management Platform</p>
        </div>

        <div className="space-y-4 text-sm leading-7 text-[#526475]">
          <p>
            The Simple Senbet platform prioritizes the dignity, privacy, and safety of Sunday School children,
            families, teachers, and church servants. This policy outlines how information is handled within parish domains.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] pt-2">1. Collected Information</h3>
          <p>
            Information stored in the platform is provided directly by authorized parish registrars and administrators,
            including student names, emergency family contacts, class enrollments, weekly attendance markers, and
            spiritual milestones.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] pt-2">2. Use of Information</h3>
          <p>
            Data is strictly used for legitimate parish administration, Sunday School curriculum delivery,
            parent communications, liturgical attendance analysis, and parish financial accountability. Data is never
            sold or shared with third-party advertising services.
          </p>

          <h3 className="font-serif text-lg font-bold text-[#0f243e] pt-2">3. Role-Based Access Controls</h3>
          <p>
            Technical measures and authorization policies ensure that only teachers assigned to a given class can
            access student evaluation cards, and only finance officers can view contribution records.
          </p>
        </div>

        <div className="pt-6 border-t border-[#f0ebd9]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7140] hover:text-[#0f243e]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
