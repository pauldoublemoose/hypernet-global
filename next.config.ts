import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The prototype lives at the repo root (index.html, _shared/, data/) and is served by app/proto/[...path].
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/proto/index.html" },
        { source: "/index.html", destination: "/proto/index.html" },
        { source: "/_shared/:file", destination: "/proto/_shared/:file" },
        { source: "/data/:file", destination: "/proto/data/:file" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // …and the prototype files must ship with that function on Vercel.
  outputFileTracingIncludes: {
    "/proto/**": ["./index.html", "./_shared/*.js", "./data/*.json"],
    "/api/maps/resolve": ["./_shared/map-link.js"],
  },
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }];
  },
};

export default nextConfig;
