import type { Metadata } from "next";
import "./globals.css";
import { SenbetProvider } from "@/context/senbet-context";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Senbet School Management | የሰንበት ትምህርት ቤት መረጃ አስተዳደር",
  description:
    "Modern, streamlined Sunday School (ሰንበት ትምህርት ቤት) student, course, assessment, and attendance management system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 antialiased">
        <SenbetProvider>
          <AppLayout>{children}</AppLayout>
        </SenbetProvider>
      </body>
    </html>
  );
}
