import type { NextConfig } from "next";



const nextConfig: NextConfig = {

  images: {

    // This tells Next.js to automatically convert images to WebP

    // when a browser supports it, regardless of the source (.jpg/.png)

    formats: ['image/webp'],

    remotePatterns: [

      {

        protocol: 'https',

        hostname: 'media.gheraltatours.com',

      },

      {

        protocol: 'https',

        hostname: 'media.gheraltaadventures.com',

      },

      {

        protocol: 'https',

        hostname: 'media.abuneyemata.com',

      },

      {

        protocol: 'https',

        hostname: 'pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev',

      },

      {

        protocol: 'http',

        hostname: 'localhost',

        port: '1337', // Common Strapi port

      },

      {

        protocol: 'http',

        hostname: '127.0.0.1',

        port: '1337',

      },

    ],

    // Optional: Increases the time optimized images stay in the cache

    minimumCacheTTL: 60,

  },

  /* config options here */

};



export default nextConfig;