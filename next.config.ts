import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // libSQL memakai binding native; jangan dibundel oleh bundler server.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // File migrasi SQL dibaca saat runtime oleh route yang mengakses database.
  outputFileTracingIncludes: {
    "/api/**/*": ["./drizzle/**/*"],
    "/hasil/**/*": ["./drizzle/**/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
