import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
