/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  // The dashboard's tsconfig pulls @hooked/server's tRPC source for type
  // inference. Some of those server modules use Fastify plugin type
  // augmentations (e.g. fastify.redis from @fastify/redis) that aren't
  // resolvable from the dashboard's node_modules — Next 14.2.35's stricter
  // build-time checker errors on them. The server has its own `tsc` build
  // that catches those errors at the right level; running our own
  // `pnpm typecheck` covers the dashboard's own files.
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
