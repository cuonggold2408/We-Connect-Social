import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "s3.vn-hcm-1.vietnix.cloud",
        port: "",
      },
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
