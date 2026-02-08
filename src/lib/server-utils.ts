// src/lib/server-utils.ts
// This file is server-only - do NOT import in client components

import { cookies, headers } from 'next/headers';

export async function getSiteName(): Promise<string> {
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "gheraltatours.com";

  try {
    // 1. Try to read the Middleware Cookie (Async in Next.js 15+)
    const cookieStore = await cookies();
    const siteDomain = cookieStore.get('site_domain')?.value;
    
    if (siteDomain) {
      // console.log(`[SSR SITE_NAME] Using cookie domain: ${siteDomain}`);
      return siteDomain.toLowerCase();
    }

    // 2. Fallback: Direct Header Inspection (Robust backup for Railway/SSR)
    const headerStore = await headers();
    const host = headerStore.get('host');
    if (host) {
      const cleanHost = host.replace('www.', '').split(':')[0].toLowerCase();
      // console.log(`[SSR SITE_NAME] Using header host: ${cleanHost}`);
      // Filter out localhost/IPs to ensure we return a valid brand or default
      if (!cleanHost.includes('localhost') && !cleanHost.includes('127.0.0.1')) {
        return cleanHost;
      }
    }

  } catch (e: any) {
    console.error("[SSR SITE_NAME] Detection failed:", e.message);
  }

  // 3. Final Fallback
  // console.warn("[SSR SITE_NAME] Fallback triggered — using env default");
  return envSite.toLowerCase();
}