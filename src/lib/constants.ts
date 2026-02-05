// src/lib/constants.ts

const rawStrapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
// Sanitize: If it doesn't start with http, and it's not empty, add https://
export const STRAPI_URL = rawStrapiUrl.startsWith('http') 
  ? rawStrapiUrl 
  : `https://${rawStrapiUrl}`;
export const R2_PUBLIC_URL = "https://pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev";

/**
 * SITE_NAME logic: Detects the domain to apply brand-specific styling.
 */
const getHostname = () => {
  // 1. Check for the Environment Variable FIRST (for local testing via PowerShell)
  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME;
  
  // If we are in development and have an env variable set, use it!
  if (process.env.NODE_ENV === 'development' && envSite) {
    return envSite.toLowerCase();
  }

  // 2. Fallback to Browser Detection for Production/Live
  if (typeof window !== "undefined") {
    const host = window.location.hostname.replace("www.", "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
       return (envSite || "gheraltatours.com").toLowerCase();
    }
    return host;
  }
  
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
 * Optimized for Strapi v5 + Cloudflare R2
 */
export const getStrapiMedia = (media: any, format: 'small' | 'medium' | 'thumbnail' | 'large' | 'original' = 'original') => {
  if (!media) return null;

  const rawData = media.data ? media.data : media;
  const item = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!item) return null;

  const data = item.attributes ? item.attributes : item;
  let url = data.url;

  // Try to find the requested format
  if (format !== 'original' && data.formats && data.formats[format]) {
    url = data.formats[format].url;
  }

  if (!url) return null;

  // FIX FOR THE "undefined/" BUG
  if (url.includes('undefined/')) {
    const fileName = url.split('undefined/')[1];
    return `${R2_PUBLIC_URL}/${fileName}`;
  }

  // Handle standard absolute URLs (R2/Cloudflare)
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  // Handle relative URLs (Local Strapi fallback)
  return `${STRAPI_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Backward compatibility alias if needed
export const getBrandLogo = (media: any) => getStrapiMedia(media, 'small');

/**
 * BRAND ATTRIBUTES
 */
export const BRANDS = {
  "gheraltatours.com": {
    id: "tours",
    name: "Gheralta Tours",
    docId: "zvmy0su5bbhsy9li5uipyzv9", 
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
    docId: "gas2cz781h3wylgc5s4sqm4w",
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
    docId: "j39unsf7fqpb8q1o0eh7w9lp",
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
  try {
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?populate=domain`, { 
      next: { revalidate: 3600 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    
    // MATCHING LOGIC: Target c.domain.name based on your actual JSON output
    const myContact = json.data?.find((c: any) => {
      const domainName = c.domain?.name; 
      return domainName?.toLowerCase() === SITE_NAME.toLowerCase();
    });

    if (!myContact) {
      console.warn(`No match for ${SITE_NAME}. Check if domain name matches exactly.`);
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
      // Pass the raw Blocks array; the Page component handles the string conversion
      address: myContact.Office_Address,
      maps: myContact.Maps_Link
    };
  } catch (error) {
    console.error("Critical Contact Fetch Error:", error);
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: "info@gheraltatours.com",
      address: "Hawzen, Tigray, Ethiopia",
    };
  }
}