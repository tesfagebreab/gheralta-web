// src/lib/server-utils.ts
// Optimized for static generation fallback

import { cookies, headers } from 'next/headers';

export async function getSiteName(): Promise<string> {
  // 1. FASTEST: Environment Variable (Static optimization friendly)
  // If this is set during build/deployment, Next.js can pre-render pages.
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME;
  if (envSite) return envSite.toLowerCase();

  try {
    // 2. MIDDLEWARE COOKIE: 
    // This is fast but makes the page dynamic.
    const cookieStore = await cookies();
    const siteDomain = cookieStore.get('site_domain')?.value;
    
    if (siteDomain) {
      return siteDomain.toLowerCase();
    }

    // 3. HEADER INSPECTION: 
    // Last resort for identifying the brand in a multi-tenant setup.
    const headerStore = await headers();
    const host = headerStore.get('host');
    if (host) {
      const cleanHost = host.replace('www.', '').split(':')[0].toLowerCase();
      if (!cleanHost.includes('localhost') && !cleanHost.includes('127.0.0.1')) {
        return cleanHost;
      }
    }
  } catch (e: any) {
    // Silent catch to prevent build-time crashes
  }

  // 4. FINAL FALLBACK: Default brand
  return "gheraltatours.com";
}