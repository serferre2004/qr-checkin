import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    domains: ['wp.nyu.edu', 'pexels.com'],
  },
  async redirects() {
    return []
  },
};
export default nextConfig;
