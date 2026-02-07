// src/lib/constants.ts

/**
 * STRAPI_URL Sanitizer
 */
const getStrapiURL = () => {
  const url = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  return url.startsWith("http") ? url : `https://${url}`;
};

export const STRAPI_URL = getStrapiURL();
export const R2_PUBLIC_URL = "https://pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev";

/**
 * NEW: Dynamic Domain Detection
 * This replaces the static SITE_NAME constant to ensure Railway 
 * detects the domain on every request, not just at build time.
 */
export async function getActiveDomain() {
  // 1. Client-side check
  if (typeof window !== "undefined") {
    return window.location.hostname.replace("www.", "").toLowerCase();
  }

  // 2. Server-side check
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    // Railway uses x-forwarded-host for custom domains
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || "";
    const domain = host.replace("www.", "").split(":")[0].toLowerCase();
    
    // Fallback to Env or default
    return domain || "gheraltatours.com";
  } catch (e) {
    return "gheraltatours.com";
  }
}

/**
 * THE NORMALIZATION HELPER
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

export interface NavItem {
  label: string;
  href: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  docId: string | null;
  accent: string;
  bgAccent: string;
  borderAccent: string;
  buttonHover: string;
  description: string;
  email: string;
  nav: NavItem[];
  colors?: {
    primary: string;
    accent: string;
    bgAccent: string;
    hover: string;
  };
}

/**
 * BRAND ATTRIBUTES 
 */
export const BRANDS: Record<string, BrandConfig> = {
  "gheraltatours.com": {
    id: "tours",
    name: "Gheralta Tours",
    docId: null, 
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
    docId: null,
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
    docId: null,
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
 * getBrand (Async) - Returns layout styles based on current domain
 */
export async function getBrand(): Promise<BrandConfig> {
  const domain = await getActiveDomain();
  const brand = BRANDS[domain] || BRANDS["gheraltatours.com"];
  
  return {
    ...brand,
    colors: {
      primary: brand.id === 'abuneyemata' ? "#0f172a" : "#c2410c",
      accent: brand.accent,
      bgAccent: brand.bgAccent,
      hover: brand.id === 'abuneyemata' ? "#1e293b" : "#9a3412"
    }
  };
}

/**
 * getDynamicBrand (Async)
 * Fetches the documentId for the current domain record in Strapi
 */
export async function getDynamicBrand(): Promise<BrandConfig> {
  const domain = await getActiveDomain();
  const baseBrand = await getBrand();

  try {
    const res = await fetch(`${STRAPI_URL}/api/domains?filters[name][$eq]=${domain}`, {
      next: { revalidate: 3600 }
    });
    
    const json = await res.json();
    const domainDocId = json.data?.[0]?.documentId;

    return {
      ...baseBrand,
      docId: domainDocId || baseBrand.docId
    };
    
  } catch (error) {
    return baseBrand;
  }
}

/**
 * CONTACT_INFO
 */
export async function getDynamicContact() {
  const domain = await getActiveDomain();

  try {
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?filters[domain][name][$eq]=${domain}`, { 
      next: { revalidate: 3600 },
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    const myContact = json.data?.[0];

    if (!myContact) {
      return {
        phone: "+251 928714272",
        whatsapp: "https://wa.me/251928714272",
        email: domain === "abuneyemata.com" ? "hello@abuneyemata.com" : "info@gheraltatours.com",
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