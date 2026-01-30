import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',               // <--- CRITICAL: Tells Next.js to generate static HTML
  images: { unoptimized: true },  // <--- Required for static export if you use <Image>
};

export default nextConfig;