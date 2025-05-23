import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  images: {
    unoptimized: false,
  },

  // Rewrite static image requests to serve from public/images
  async rewrites() {
    return [
      {
        source: '/static/img/:path*',
        destination: '/images/:path*',
      },
    ];
  },
};

export default nextConfig;
