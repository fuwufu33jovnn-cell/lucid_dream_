import type { NextConfig } from "next";

const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/lucid_dream_" : "";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === "true" ? "export" : undefined,
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: githubPagesBasePath },
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { tsconfigPath: "./tsconfig.next.json" },
};

export default nextConfig;
