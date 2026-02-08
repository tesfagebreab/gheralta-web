import Link from 'next/link';
import Image from 'next/image';
import { getBrand, getDynamicContact, STRAPI_URL, getStrapiMedia } from '@/lib/constants';
import { getSiteName } from '@/lib/server-utils';

// Helper to prevent "Objects are not valid as React child" for the address field
const parseStrapiBlocks = (content: any): string => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(block => {
      if (block.children && Array.isArray(block.children)) {
        return block.children.map((child: any) => child.text || "").join("");
      }
      return "";
    }).join(" ");
  }
  return "";
};

export default async function Footer() {

  const currentSite = getSiteName(); // safe in server component
  const brand = getBrand();
  
  let contact = { phone: "", address: "", whatsapp: "" };
  let logoUrl: string | null = null;

  try {
    const [contactData, domainRes] = await Promise.all([
      getDynamicContact(),
      fetch(`${STRAPI_URL}/api/domains?populate=*`, { 
        cache: 'no-store' 
      })
    ]);

    contact = contactData;
    const domainJson = await domainRes.json();
    
    if (domainJson.data && Array.isArray(domainJson.data)) {
      const myDomainData = domainJson.data.find((d: any) => {
        const dName = d.domain || d.name || d.attributes?.domain || d.attributes?.name;
        return dName?.toLowerCase().includes(currentSite.toLowerCase());
      });

      const rawLogo = myDomainData?.brand_logo || myDomainData?.attributes?.brand_logo;

      if (rawLogo) {
        logoUrl = getStrapiMedia(rawLogo, 'small');
      }
    }
  } catch (e) {
    console.error("Footer data fetch failed", e);
  }
  
  return (
    <footer className="bg-stone-900 text-white pt-16 md:pt-24 pb-12 rounded-t-[2.5rem] md:rounded-t-[3rem] mt-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
        
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {logoUrl ? (
              <div className="relative h-14 w-14 md:h-16 md:w-16">
                <Image 
                  src={logoUrl} 
                  alt={currentSite} 
                  fill 
                  className="object-contain" 
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full border border-stone-800 flex items-center justify-center font-black italic text-[#c2410c] text-xl">
                {brand.name.charAt(0)}
              </div>
            )}
            <h2 className="text-2xl md:text-3xl font-sans font-black italic uppercase tracking-tighter mt-2 md:mt-0">
               {brand.name.split(' ')[0]} 
               <span className="text-[#c2410c]"> {brand.name.split(' ').slice(1).join(' ')}</span>
            </h2>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed max-w-sm font-medium">
            Providing the standard of excellence in the Gheralta Mountains. 
            Rooted in local heritage, driven by professional logistics.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Explore</h3>
          <ul className="space-y-4">
            {brand.nav.map(link => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className="text-sm font-bold transition-colors hover:text-[#c2410c] text-stone-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/booking-terms" className="text-sm font-bold transition-colors hover:text-[#c2410c] text-stone-300">
                BOOKING TERMS
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Base Camp</h3>
          <ul className="space-y-4 text-stone-300 text-sm font-medium">
            <li className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
              <span className="text-[#c2410c]">📍</span> 
              <span>{parseStrapiBlocks(contact.address)}</span>
            </li>
            <li className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
              <span className="text-[#c2410c]">📞</span> 
              <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
            </li>
            <li className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
              <span className="text-[#c2410c]">✉️</span> 
              <a href={`mailto:${brand.email}`} className="hover:underline break-all">{brand.email}</a>
            </li>
            <li className="flex flex-col items-center md:items-start gap-3 mt-6">
              <span className="text-[#25d366] text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
              <a 
                href={contact.whatsapp} 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25d366] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
              >
                Chat With Us
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 mt-16 md:mt-20 pt-8 border-t border-stone-800 text-center flex flex-col items-center gap-4">
        <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-stone-600 font-bold">
          © {new Date().getFullYear()} {currentSite}. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}