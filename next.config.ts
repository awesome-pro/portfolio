import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No serverActions.bodySizeLimit override on purpose: architecture media is
  // uploaded straight to Supabase Storage from the browser using a pre-signed
  // URL, so uploads never pass through a Server Action. The previous 12mb
  // override only existed to carry images through one, and it is not needed by
  // any remaining action — the largest payload we send is the story markdown,
  // currently ~11KB against Next's 1MB default.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
