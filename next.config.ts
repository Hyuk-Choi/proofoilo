import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "0.0.0.0",
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
    "*.local",
    "*.localdomain",
  ],
  reactStrictMode: true,
};

export default nextConfig;
