import { redirect } from "next/navigation";

export default function AttendanceAdminHome() {
  redirect("/attendance/super-admin/dashboard");
}
