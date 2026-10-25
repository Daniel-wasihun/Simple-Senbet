import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
