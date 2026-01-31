import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure basePath for nginx subpath routing
  // This makes all routes work under /kg-adm/
  basePath: '/kg-adm',
  // Prefix all assets with /kg-adm
  assetPrefix: '/kg-adm',
};

export default nextConfig;
