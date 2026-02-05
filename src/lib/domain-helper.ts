// src/lib/domain-helper.ts
import 'server-only';
import { headers } from 'next/headers';
import { BRANDS, STRAPI_URL } from './constants';

export async function getActiveDomain() {
  let host = "";
  try {
    const headerList = await headers();
    host = headerList.get('host')?.replace("www.", "").split(':')[0].toLowerCase() || "";
  } catch (e) {
    // Falls back if called in a context where headers aren't available (like build time)
    // console.warn("Headers not available, using fallback");
  }

  const envSite = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME;

  // Logic: Use real domain if available, otherwise use env variable (for local dev)
  if (host && !host.includes('localhost') && !host.includes('internal') && !host.includes('railway')) {
    return host;
  }
  
  return (envSite || "gheraltatours.com").toLowerCase();
}

export async function getBrand() {
  const domain = await getActiveDomain();
  const brand = BRANDS[domain as keyof typeof BRANDS] || BRANDS["gheraltatours.com"];
  
  return {
    ...brand,
    domain,
    colors: {
      primary: brand.id === 'abuneyemata' ? "#0f172a" : "#c2410c",
      accent: brand.accent,
      bgAccent: brand.bgAccent,
      hover: brand.id === 'abuneyemata' ? "#1e293b" : "#9a3412"
    }
  };
}

/**
 * CONTACT_INFO (Railway-Safe)
 */
export async function getDynamicContact() {
  const domain = await getActiveDomain();

  try {
    // Ensure we don't crash if STRAPI_URL is missing in strict environments
    const apiUrl = STRAPI_URL || 'http://localhost:1337';
    
    const res = await fetch(`${apiUrl}/api/contact-infos?populate=domain`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error();
    const json = await res.json();
    
    const myContact = json.data?.find((c: any) => {
      const dName = c.domain?.name || c.attributes?.domain?.data?.attributes?.name;
      return dName?.toLowerCase() === domain.toLowerCase();
    });

    if (!myContact) throw new Error();

    return {
      phone: myContact.Phone,
      whatsapp: `https://wa.me/${myContact.Phone?.replace(/\D/g, '')}`,
      email: myContact.Email,
      address: myContact.Office_Address,
    };
  } catch (error) {
    return {
      phone: "+251 928714272",
      whatsapp: "https://wa.me/251928714272",
      email: domain === "abuneyemata.com" ? "hello@abuneyemata.com" : "info@gheraltatours.com",
      address: "Hawzen, Tigray, Ethiopia",
    };
  }
}