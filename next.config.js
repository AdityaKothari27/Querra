/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable streaming responses
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable buffering for API routes
  poweredByHeader: false,
  // Ensure proper streaming
  compress: false,
  webpack: (config) => {
    // This is to handle the fs module error
    config.resolve.fallback = { 
      fs: false,
      path: false,
      stream: false,
      process: false
    };
    return config;
  },
}

module.exports = nextConfig; 