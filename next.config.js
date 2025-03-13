//NOTE THAT THIS FILE IS ASSUMED UNCHANGED . SO TO REVERT BACK TO THE ORIGINAL ADD STATE USE THIS COMMAND BELOW
// git update-index --no-assume-unchanged next.config.js

// TO ENABLE THE ASSUME UNCHANGED USE THIS COMMAND BELOW
// git update-index --assume-unchanged next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        basePath: false,
      },
    ];
  },
  // Update CORS and timeout configurations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Connection, Keep-Alive' },
          { key: 'Connection', value: 'keep-alive' },
          { key: 'Keep-Alive', value: 'timeout=120' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
  // Add custom server configuration
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
      responseLimit: false,
    },
  },
  experimental: {
    serverComponents: true,
    proxyTimeout: 120000, // 2 minutes
    timeout: 120000,
  },
  images: {
    domains: ['nfvlyrknjdzpvrgpetck.supabase.co', 'dummyimage.com'],
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
