import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/registry',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/my-campaigns',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/portfolio',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/activity',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/create',
        destination: '/campaigns/new',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
