import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // Bundled, exifr can't find node's fs/zlib and logs "Couldn't load ..." on every upload.
  serverExternalPackages: ["exifr"],
};

export default nextConfig;
