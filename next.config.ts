import type { NextConfig } from "next";

const nextConfig: NextConfig = {
output: 'standalone', // This is essential for Docker/Railway deployments

  images: {
    // Automatically convert images to WebP for better performance
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.gheraltatours.com',
        pathname: '/**', // Matches all images on this domain
      },
      {
        protocol: 'https',
        hostname: 'media.gheraltaadventures.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.abuneyemata.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev',
        pathname: '/**',
      },
      // Local development patterns
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '1337',
        pathname: '/**',
      },
    ],
    // Cache optimized images for 60 seconds (standard for dynamic sites)
    minimumCacheTTL: 60,
  },
  /* other config options here */
};

export default nextConfig;