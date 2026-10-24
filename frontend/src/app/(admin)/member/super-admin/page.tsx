import { redirect } from "next/navigation";

export default function MemberAdminHome() {
  redirect("/member/super-admin/dashboard");
}
