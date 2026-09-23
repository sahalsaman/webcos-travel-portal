import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.savaari.com", pathname: "/blog/wp-content/uploads/**" },
      {
        protocol: "https",
        hostname: "d3gz7d9rg09miz.cloudfront.net",
        pathname: "/travel/**",
      },
      {
        protocol: "https",
        hostname: "ak-d.tripcdn.com",
        pathname: "/images/**",
      },
    ],
  },
  // Mongoose ships native/optional deps that should not be bundled for RSC.
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
