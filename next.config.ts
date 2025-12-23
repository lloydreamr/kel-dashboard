import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

// Note: next.config.ts requires export default (Next.js convention)
export default nextConfig;
