/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['@napi-rs/canvas', 'fluent-ffmpeg', 'uuid'],
};

module.exports = nextConfig;
