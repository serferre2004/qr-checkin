import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  async redirects() {
    return [
      {
        source: '/program',
        destination: 'https://pepqa.co/program/',
        permanent: false,
        basePath: false
      },
    ]
  },
};
export default nextConfig;
