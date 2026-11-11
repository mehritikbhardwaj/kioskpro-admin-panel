/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow cross-origin API calls from the KioskPro WPF desktop app
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/software-download',
        destination: 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe',
        permanent: false,
      },
      {
        source: '/download',
        destination: 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
