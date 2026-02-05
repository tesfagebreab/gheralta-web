// src/lib/constants.ts
import { headers } from 'next/headers'; // Added for production domain detection

export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
export const R2_PUBLIC_URL = "https://pub-9ff861aa5ec14578b94dca9cd38e3f70.r2.dev";

/**
 * SITE_NAME logic: Dynamic detection for multi-domain production.
 */
export const getSiteName = () => {
  const envSite = (process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "gheraltatours.com").toLowerCase();
  
  // 1. Client-Side (Browser)
  if (typeof window !== "undefined") {
    const host = window.location.hostname.replace("www.", "").toLowerCase();
    // Use the actual domain if it's not a local or internal railway URL
    if (host !== "localhost" && host !== "127.0.0.1" && !host.includes("railway.app")) {
      return host;
    }
    return envSite;
  }

  // 2. Server-Side (Production Request)
  try {
    const headerList = headers();
    const host = headerList.get('host')?.replace("www.", "").toLowerCase();
    
    if (host && !host.includes("localhost") && !host.includes("railway.app")) {
      return host;
    }
  } catch (e) {
    // Fallback for build-time static generation
  }

  return envSite;
};

// Internal helper for this file
const SITE_NAME = getSiteName();

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
    radius: "rounded-[2rem]", 
    cardStyle: "shadow-sm border-stone-100",
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
    accent: "text-[#65a30d]",
    bgAccent: "bg-[#65a30d]",
    borderAccent: "border-[#65a30d]",
    buttonHover: "hover:bg-[#4d7c0f]",
    radius: "rounded-xl",
    cardStyle: "shadow-md shadow-stone-200 border-stone-200",
    description: "High-octane rock climbing and trekking.",
    email: "bookings@gheraltaadventures.com",
    nav: [
      { label: "ADVENTURES", href: "/tours" },
      { label: "OUR STORY", href: "/about-us" },
      { label: "OUR THINKING", href: "/blog" },
      { label: "CONTACT", href: "/contact" }
    ]
  },
  "abuneyemata.com": {
    id: "abuneyemata",
    name: "Abune Yemata",
    docId: "j39unsf7fqpb8q1o0eh7w9lp",
    accent: "text-[#44403c]",
    bgAccent: "bg-[#44403c]",
    borderAccent: "border-[#44403c]",
    buttonHover: "hover:bg-[#292524]",
    radius: "rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-none rounded-bl-none", 
    cardStyle: "shadow-inner bg-stone-50 border-none",
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
  const currentSite = getSiteName();
  const match = Object.keys(BRANDS).find(key => key === currentSite);
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
  const currentSite = getSiteName();
  try {
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?populate=domain`, { 
      next: { revalidate: 3600 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    
    const myContact = json.data?.find((c: any) => {
      const domainName = c.domain?.name; 
      return domainName?.toLowerCase() === currentSite;
    });

    if (!myContact) {
      console.warn(`No match for ${currentSite}. Falling back.`);
      return {
        phone: "+251 928714272",
        whatsapp: "https://wa.me/251928714272",
        email: currentSite === "abuneyemata.com" ? "hello@abuneyemata.com" : "info@gheraltatours.com",
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