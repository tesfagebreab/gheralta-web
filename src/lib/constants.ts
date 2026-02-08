// src/lib/constants.ts
// RAILPACK CACHE BUST - 2026-02-08 FINAL - BRAND PROPAGATION UPDATE

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
 * Uses semantic classes defined in globals.css for propagation
 */
export const BRANDS = {
  "gheraltatours.com": {
    id: "tours",
    name: "Gheralta Tours",
    accent: "text-brand-accent",
    bgAccent: "bg-brand-accent",
    borderAccent: "border-brand-accent",
    buttonHover: "hover:bg-brand-hover",
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
    accent: "text-brand-accent",
    bgAccent: "bg-brand-accent",
    borderAccent: "border-brand-accent",
    buttonHover: "hover:bg-brand-hover",
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
    accent: "text-brand-accent",
    bgAccent: "bg-brand-accent",
    borderAccent: "border-brand-accent",
    buttonHover: "hover:bg-brand-hover",
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
 * BRAND GETTER (Universal Logic)
 */
export const getBrand = (domain?: string) => {
  let activeDomain = "gheraltatours.com";

  if (domain) {
    activeDomain = domain;
  } else if (typeof window !== "undefined") {
    activeDomain = window.location.hostname;
  }

  activeDomain = activeDomain.replace("www.", "").split(":")[0].toLowerCase();

  const match = Object.keys(BRANDS).find(key => activeDomain.includes(key)) || "gheraltatours.com";
  const brand = BRANDS[match as keyof typeof BRANDS];
  
  return {
    ...brand,
    colors: {
      // Primary used for non-tailwind scripts (like Google Maps markers)
      primary: brand.id === 'abuneyemata' ? "#991b1b" : (brand.id === 'adventures' ? "#15803d" : "#c2410c"),
      accent: brand.accent,
      bgAccent: brand.bgAccent,
      hover: brand.id === 'abuneyemata' ? "#7f1d1d" : (brand.id === 'adventures' ? "#166534" : "#9a3412")
    }
  };
};

/**
 * CONTACT_INFO (Dynamic & Relation-Aware)
 */
export async function getDynamicContact(domain?: string) {
  const brandData = getBrand(domain);
  const activeDomain = brandData.email.split('@')[1];

  try {
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?populate=domain`, { 
      next: { revalidate: 3600 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    
    const myContact = json.data?.find((c: any) => {
      const domainData = getField(c, 'domain');
      const dName = getField(domainData, 'name') || c.domain?.name;
      return dName?.toLowerCase().includes(activeDomain.toLowerCase());
    });

    if (!myContact) {
      return {
        phone: "+251 928714272",
        whatsapp: "https://wa.me/251928714272",
        email: brandData.email,
        address: "Hawzen, Tigray, Ethiopia",
      };
    }

    return {
      phone: myContact.Phone || myContact.phone,
      whatsapp: `https://wa.me/${(myContact.Phone || myContact.phone || "251928714272").replace(/\D/g, '')}`,
      email: myContact.Email || myContact.email,
      address: myContact.Office_Address || myContact.office_address,
      maps: myContact.Maps_Link || myContact.maps_link
    };
  } catch (error) {
    console.error("Critical Contact Fetch Error:", error);
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: brandData.email,
      address: "Hawzen, Tigray, Ethiopia",
    };
  }
}