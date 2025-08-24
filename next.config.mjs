/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Handle environment variables gracefully
  env: {
    CUSTOM_KEY: process.env.OPENROUTER_API_KEY,
  },
}

export default nextConfig
