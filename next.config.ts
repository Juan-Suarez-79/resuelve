import type { NextConfig } from "next";

// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
// });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "jxvtfejtpwonqtulbkxp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
// export default withPWA(nextConfig);
