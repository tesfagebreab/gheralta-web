// src/lib/constants.ts
import { headers } from 'next/headers';

/**
 * STRAPI_URL Sanitizer
 */
const getStrapiURL = () => {
  const url = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  if (url.includes("localhost") || url.includes("127.0.0.1") || url.startsWith("http")) {
    return url;
  }
  return `https://${url}`;
};

export const STRAPI_URL = getStrapiURL();
export const R2_PUBLIC_URL = "https://pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev";

/**
 * SITE_NAME logic: Detects the domain to apply brand-specific styling.
 * Updated to handle server-side headers for multi-domain Railway support.
 */
const getHostname = () => {
  // 1. Client-side detection
  if (typeof window !== "undefined") {
    const host = window.location.hostname.replace("www.", "").toLowerCase();
    if (host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  // 2. Server-side detection (Crucial for Railway)
  try {
    const headerList = headers();
    // Use a try-catch because headers() can only be called in server components/actions
    const host = (headerList as any).get('host')?.replace("www.", "").toLowerCase();
    if (host && !host.includes('localhost') && !host.includes('internal')) {
      return host;
    }
  } catch (e) {
    // Fallback if called outside of a request context
  }

  // 3. Fallback to Env Variable
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME;
  return (envSite || "gheraltatours.com").toLowerCase();
};

export const SITE_NAME = getHostname();

/**
 * THE NORMALIZATION HELPER (Strapi v5 compatibility)
 */
export const getField = (obj: any, fieldName: string) => {
  if (!obj) return null;
  const target = obj.data ? obj.data : obj;
  const finalTarget = Array.isArray(target) ? target[0] : target;
  if (!finalTarget || typeof finalTarget !== 'object') return null;

  const key = Object.keys(finalTarget).find(k => k.toLowerCase() === fieldName.toLowerCase());
  if (!key) return null;

  const value = finalTarget[key];
  if (value && typeof value === 'object' && value !== null && 'data' in value) {
    return value.data;
  }
  return value;
};

/**
 * UNIVERSAL IMAGE HELPER
 */
export const getStrapiMedia = (media: any, format: 'small' | 'medium' | 'thumbnail' | 'large' | 'original' = 'original') => {
  if (!media) return null;

  const rawData = media.data ? media.data : media;
  const item = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!item) return null;

  const data = item.attributes ? item.attributes : item;
  let url = data.url;

  if (format !== 'original' && data.formats && data.formats[format]) {
    url = data.formats[format].url;
  }

  if (!url) return null;

  if (url.includes('undefined/')) {
    const fileName = url.split('undefined/')[1];
    return `${R2_PUBLIC_URL}/${fileName}`;
  }

  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  return `${STRAPI_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getBrandLogo = (media: any) => getStrapiMedia(media, 'small');

/**
 * BRAND ATTRIBUTES
 * Removed docId to prevent 404s caused by environment mismatches.
 */
export const BRANDS = {
  "gheraltatours.com": {
    id: "tours",
    name: "Gheralta Tours",
    accent: "text-[#c2410c]",
    bgAccent: "bg-[#c2410c]",
    borderAccent: "border-[#c2410c]",
    buttonHover: "hover:bg-[#9a3412]",
    description: "Expert-led cultural and historical journeys.",
    email: "info@gheraltatours.com",
    nav: [
      { label: "TOURS", href: "/tours" },
      { label: "OUR STORY", href: "/about-us" },
      { label: "OUR THINKING", href: "/blog" },
      { label: "CONTACT", href: "/contact" }
    ]
  },
  "gheraltaadventures.com": {
    id: "adventures",
    name: "Gheralta Adventures",
    accent: "text-[#c2410c]",
    bgAccent: "bg-[#c2410c]",
    borderAccent: "border-[#c2410c]",
    buttonHover: "hover:bg-[#9a3412]",
    description: "High-octane rock climbing and trekking.",
    email: "bookings@gheraltaadventures.com",
    nav: [
      { label: "TOURS", href: "/tours" },
      { label: "OUR STORY", href: "/about-us" },
      { label: "OUR THINKING", href: "/blog" },
      { label: "CONTACT", href: "/contact" }
    ]
  },
  "abuneyemata.com": {
    id: "abuneyemata",
    name: "Abune Yemata",
    accent: "text-slate-900",
    bgAccent: "bg-slate-900",
    borderAccent: "border-slate-900",
    buttonHover: "hover:bg-slate-800",
    description: "Pilgrimages and spiritual journeys.",
    email: "hello@abuneyemata.com",
    nav: [
      { label: "TOURS", href: "/tours" },
      { label: "OUR STORY", href: "/about-us" },
      { label: "OUR THINKING", href: "/blog" },
      { label: "CONTACT", href: "/contact" }
    ]
  }
};

export const getBrand = () => {
  const match = Object.keys(BRANDS).find(key => key === SITE_NAME);
  const brand = match ? BRANDS[match as keyof typeof BRANDS] : BRANDS["gheraltatours.com"];
  
  return {
    ...brand,
    colors: {
      primary: brand.id === 'abuneyemata' ? "#0f172a" : "#c2410c",
      accent: brand.accent,
      bgAccent: brand.bgAccent,
      hover: brand.id === 'abuneyemata' ? "#1e293b" : "#9a3412"
    }
  };
};

/**
 * CONTACT_INFO (Dynamic & Relation-Aware)
 */
export async function getDynamicContact() {
  if (!STRAPI_URL || STRAPI_URL.includes('undefined')) {
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: "info@gheraltatours.com",
      address: "Hawzen, Tigray, Ethiopia",
    };
  }

  try {
    // Added no-store to ensure the brand switch works immediately on Railway
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?populate=domain`, { 
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);
    const json = await res.json();
    
    const myContact = json.data?.find((c: any) => {
      // Use the name for matching instead of ID
      const domainName = c.domain?.name || c.attributes?.domain?.data?.attributes?.name; 
      return domainName?.toLowerCase() === SITE_NAME.toLowerCase();
    });

    if (!myContact) {
      return {
        phone: "+251 928714272",
        whatsapp: "https://wa.me/251928714272",
        email: SITE_NAME === "abuneyemata.com" ? "hello@abuneyemata.com" : "info@gheraltatours.com",
        address: "Hawzen, Tigray, Ethiopia",
      };
    }

    return {
      phone: myContact.Phone,
      whatsapp: `https://wa.me/${myContact.Phone?.replace(/\D/g, '')}`,
      email: myContact.Email,
      address: myContact.Office_Address,
      maps: myContact.Maps_Link
    };
  } catch (error) {
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: "info@gheraltatours.com",
      address: "Hawzen, Tigray, Ethiopia",
    };
  }
}