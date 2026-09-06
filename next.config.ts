import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }],
      },
    ];
  },
  images: {
    qualities: [75, 90],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
