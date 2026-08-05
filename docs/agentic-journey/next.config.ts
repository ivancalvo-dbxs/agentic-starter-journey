import type { NextConfig } from "next";

// Static export to GitHub Pages at https://ivancalvo-dbxs.github.io/agentic-starter-journey/.
// basePath must match the repo name; trailingSlash keeps /docs/foo/ resolving to
// out/docs/foo/index.html, which is what Pages serves without a rewrite layer.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/agentic-starter-journey",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
