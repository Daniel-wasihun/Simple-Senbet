import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Simple Senbet | የሰንበት ትምህርት ቤት | Ethiopian Orthodox Sunday School",
  description: "Administrative & spiritual management platform for Ethiopian Orthodox Tewahedo Church Sunday Schools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[#fcfaf5] text-[#132438]" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
