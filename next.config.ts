import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-0307a9d9240347eca9673cc7d4e52b3f.r2.dev',
      },
    ],
  },
};

export default nextConfig;
