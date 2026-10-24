import { redirect } from "next/navigation";

export default function FinanceAdminHome() {
  redirect("/finance/super-admin/dashboard");
}
