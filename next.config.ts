import type { NextConfig } from "next";

const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/lucid_dream_" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { tsconfigPath: "./tsconfig.next.json" },
};

export default nextConfig;
