import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { LanguageProvider } from "@/context/language-context";
import { SenbetProvider } from "@/context/senbet-context";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Senbet School Management | የሰንበት ትምህርት ቤት መረጃ አስተዳደር | Mana Barumsa Dilbataa",
  description:
    "Modern, streamlined Sunday School (ሰንበት ትምህርት ቤት) student, course, assessment, and attendance management system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
        <ThemeProvider>
          <LanguageProvider>
            <SenbetProvider>
              <AppLayout>{children}</AppLayout>
            </SenbetProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
