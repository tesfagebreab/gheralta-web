// src/lib/constants.ts
// RAILPACK CACHE BUST - 2026-02-08 FINAL - STRAPI V5 COMPATIBLE

import { getSiteName } from './server-utils';

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
 * THE NORMALIZATION HELPER (Strapi v5 compatibility)
 */
export const getField = (obj: any, fieldName: string) => {
  if (!obj) return null;
  
  // v5 often flattens data, so we check the top level, then .attributes
  const target = obj.attributes ? obj.attributes : obj;
  
  // Case-insensitive key lookup
  const key = Object.keys(target).find(k => k.toLowerCase() === fieldName.toLowerCase());
  if (!key) return null;

  const value = target[key];
  
  // Handle nested .data wrapping if it exists (legacy/v4 style)
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

/**
 * Updated getBrand to handle server-side hostname detection
 */
export const getBrand = (domain?: string) => {
  // Use provided domain, or detect via window, but default to gheraltatours.com
  const activeDomain = domain || (typeof window !== "undefined" 
    ? window.location.hostname.replace("www.", "").toLowerCase() 
    : "gheraltatours.com");

  const match = Object.keys(BRANDS).find(key => key === activeDomain);
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
 * CONTACT_INFO (Strapi v5 Relation Aware)
 */
export async function getDynamicContact(domain?: string) {
  // If we are on server and no domain passed, try to get it from middleware/headers
  let activeDomain = domain;
  if (!activeDomain && typeof window === "undefined") {
    activeDomain = await getSiteName();
  } else if (!activeDomain && typeof window !== "undefined") {
    activeDomain = window.location.hostname.replace("www.", "").toLowerCase();
  }
  
  if (!activeDomain) activeDomain = "gheraltatours.com";

  try {
    // In v5, we filter by domain name directly in the query for efficiency
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?filters[domain][name][$eq]=${activeDomain}&populate=*`, { 
      next: { revalidate: 60 }, // Lower revalidate for debugging
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const json = await res.json();
    
    // v5 logic: the record we want is usually json.data[0] because of the filter
    const rawContact = json.data?.[0];
    const myContact = rawContact?.attributes || rawContact;

    if (!myContact) {
      return {
        phone: "+251 928714272",
        whatsapp: "https://wa.me/251928714272",
        email: activeDomain === "abuneyemata.com" ? "hello@abuneyemata.com" : "info@gheraltatours.com",
        address: "Hawzen, Tigray, Ethiopia",
        isFallback: true
      };
    }

    // Map Strapi fields (matching your PascalCase/camelCase in DB)
    return {
      phone: getField(myContact, "Phone"),
      whatsapp: `https://wa.me/${(getField(myContact, "Phone") || "").replace(/\D/g, '')}`,
      email: getField(myContact, "Email"),
      address: getField(myContact, "Office_Address"),
      maps: getField(myContact, "Maps_Link"),
      isFallback: false
    };
  } catch (error) {
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: "info@gheraltatours.com",
      address: "Hawzen, Tigray, Ethiopia",
      isFallback: true
    };
  }
}