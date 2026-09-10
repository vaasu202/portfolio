import type { NextConfig } from "next";
import { createRequire } from "node:module";

const projectRequire = createRequire(`${process.cwd()}/package.json`);
const wgslLoader = createRequire(projectRequire.resolve("vgpu")).resolve("@vgpu/wgsl/loader-webpack");

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  turbopack: { rules: { "*.wgsl": { loaders: [wgslLoader], as: "*.js" } } },
};

export default nextConfig;
