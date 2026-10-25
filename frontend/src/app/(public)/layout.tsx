"use client";

import { usePathname } from "next/navigation";
import { PublicSiteLayout } from "@/components/public/PublicSiteLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <PublicSiteLayout hideFooter={isLoginPage}>
      {children}
    </PublicSiteLayout>
  );
}
