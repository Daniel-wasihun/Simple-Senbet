import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  allowedDevOrigins: [
    "localhost:5174",
    "127.0.0.1:5174",
    "localhost",
    "127.0.0.1",
  ],
  async redirects() {
    return [
      { source: "/super-admin/dashboard", destination: "/dashboard", permanent: false },
      { source: "/acadamic/super-admin/dashboard", destination: "/academics", permanent: false },
      { source: "/attendance/super-admin/dashboard", destination: "/attendance", permanent: false },
      { source: "/finance/super-admin/dashboard", destination: "/finance", permanent: false },
      { source: "/member/super-admin/dashboard", destination: "/members", permanent: false },
      { source: "/admin/administration/users", destination: "/administration/users", permanent: false },
      { source: "/admin/administration/access", destination: "/administration/access", permanent: false },
      { source: "/school-management/academic-years", destination: "/academics/academic-years", permanent: false },
      { source: "/school-management/school-classes", destination: "/academics/school-classes", permanent: false },
      { source: "/school-management/courses", destination: "/academics/courses", permanent: false },
      { source: "/school-management/teaching-assignments", destination: "/academics/teaching-assignments", permanent: false },
      { source: "/school-management/enrollments", destination: "/academics/enrollments", permanent: false },
      { source: "/school-management/assessments", destination: "/academics/assessments", permanent: false },
      { source: "/school-management/assessment-results", destination: "/academics/assessment-results", permanent: false },
      { source: "/school-management/promotions", destination: "/academics/promotions", permanent: false },
      { source: "/dashboard/payments", destination: "/finance", permanent: false },
      { source: "/super-admin/dashboard/payments", destination: "/finance", permanent: false },
      // Legacy /*/dashboard → clean routes
      { source: "/academics/dashboard", destination: "/academics", permanent: true },
      { source: "/attendance/dashboard", destination: "/attendance", permanent: true },
      { source: "/finance/dashboard", destination: "/finance", permanent: true },
      { source: "/members/dashboard", destination: "/members", permanent: true },
    ];
  },
};

export default nextConfig;
