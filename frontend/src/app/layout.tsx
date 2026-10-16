import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Senbet | Laravel + Next.js",
  description: "Sunday School Management App built with Laravel 13 and Next.js 16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
