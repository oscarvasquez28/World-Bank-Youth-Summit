import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Point turbopack.root to the monorepo root so Turbopack can resolve
  // shared node_modules and the `next` package when running inside app/
  turbopack: { root: path.resolve(__dirname, '../..') },
};

export default nextConfig;
