import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare R2 public custom domain (aidlc-docs/construction/shared-infrastructure.md).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.inkwell.app",
      },
    ],
  },
};

export default nextConfig;
