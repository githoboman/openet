/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      pngjs: false,
    };
    return config;
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Origin-Agent-Cluster', value: '?1' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ] }];
  },
};

export default nextConfig;
