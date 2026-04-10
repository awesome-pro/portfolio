import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/resume",
        destination:
          "https://docs.google.com/document/d/1bvaxZbr2SewFizeHdOykxm2kRvrApqgTXZMDrR8dtYc/edit?tab=t.0",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
