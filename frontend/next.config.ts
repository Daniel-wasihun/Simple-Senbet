import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore - Next.js 16 agent rules disable
  agentRules: false,
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
