import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (t === 'dark' || (!t && d)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen antialiased bg-[#fcfaf5] dark:bg-[#0a0e1a] text-[#132438] dark:text-[#f1f5f9]"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
