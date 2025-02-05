/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://www.xcelinfotech.com/bs/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
