// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/loginPage',
        permanent: false, // temporary redirect
      },
    ]
  },
}

module.exports = nextConfig
