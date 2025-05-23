import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  logging: {
    incomingRequests: true,
  },
};

export default nextConfig;
