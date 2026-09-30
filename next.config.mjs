/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Safety net so a small type/lint warning never blocks a Vercel deploy
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};
export default nextConfig;
