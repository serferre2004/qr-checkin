import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    domains: ['wp.nyu.edu'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://pepqa.co/program/',
        permanent: false,
        basePath: false
      },
    ]
  },
};
export default nextConfig;
