// src/lib/server-utils.ts
// This file is server-only - do NOT import in client components

import { cookies } from 'next/headers';

export function getSiteName(): string {
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "gheraltatours.com";

  try {
    const cookieStore = cookies();
    const siteDomain = cookieStore.get('site_domain')?.value;
    if (siteDomain) {
      console.log(`SSR SITE_NAME from cookie: ${siteDomain}`);
      return siteDomain.toLowerCase();
    }
  } catch (e) {
    console.error("SSR cookie read error:", e);
  }

  console.warn("SITE_NAME fallback in SSR — using env default");
  return envSite.toLowerCase();
}