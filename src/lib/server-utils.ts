// src/lib/server-utils.ts
// This file is server-only - do NOT import in client components

import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export function getSiteName(): string {
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "gheraltatours.com";

  try {
    // @ts-ignore - next/headers is server-only, TS sometimes flags it incorrectly in utils
    const cookieStore: ReadonlyRequestCookies = cookies();
    
    const siteDomain = cookieStore.get('site_domain')?.value;
    
    console.log(`[SSR SITE_NAME] Raw cookie site_domain: ${siteDomain}`);
    
    if (siteDomain) {
      console.log(`[SSR SITE_NAME] Using cookie domain: ${siteDomain}`);
      return siteDomain.toLowerCase();
    }
  } catch (e: any) {
    console.error("[SSR SITE_NAME] Cookie read failed:", e.message);
  }

  console.warn("[SSR SITE_NAME] Fallback triggered — using env default");
  return envSite.toLowerCase();
}