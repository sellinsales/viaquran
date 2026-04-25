/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    webpackMemoryOptimizations: true,
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1000,
  },
};

export default nextConfig;
