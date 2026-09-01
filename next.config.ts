import type { NextConfig } from "next";

const githubPagesBuild =
  process.env.GITHUB_ACTIONS === "true" && process.env.LUCID_SERVER_BUILD !== "1";
const githubPagesBasePath = githubPagesBuild ? "/lucid_dream_" : "";

const nextConfig: NextConfig = {
  output: githubPagesBuild ? "export" : undefined,
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: githubPagesBasePath },
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { tsconfigPath: "./tsconfig.next.json" },
};

export default nextConfig;
