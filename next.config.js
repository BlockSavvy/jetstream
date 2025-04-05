/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude problematic pages from static generation
  experimental: {
    // Option to disable automatic static optimization for specific routes
    optimizePackageImports: ['recharts'],
  },
  // Set proper page options for simulation page
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  // Mark problematic pages as dynamically rendered
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

module.exports = nextConfig 