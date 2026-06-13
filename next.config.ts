import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
