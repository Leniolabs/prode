/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {},
  serverExternalPackages: ['@napi-rs/canvas', 'fluent-ffmpeg'],
}

module.exports = nextConfig
