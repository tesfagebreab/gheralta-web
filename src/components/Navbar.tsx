'use client';

import Link from 'next/link';
import Image from "next/image"; 
import { usePathname } from 'next/navigation';
import { STRAPI_URL, getStrapiMedia } from "@/lib/constants";
import { getBrand } from "@/lib/domain-helper";
import { useState, useEffect } from 'react';

// Force Next.js to skip the cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Navbar() {
  const [brand, setBrand] = useState<any>(null);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [whatsappLink, setWhatsappLink] = useState(`https://wa.me/251928714272`);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    async function fetchData() {
      try {
        // 1. Get Brand Config dynamically based on hostname
        const brandConfig = await getBrand();
        setBrand(brandConfig);
        const SITE_NAME = brandConfig.domain;

        // 2. Fetch Contact Info for WhatsApp dynamic link
        const contactRes = await fetch(`${STRAPI_URL}/api/contact-infos?filters[domain][name][$containsi]=${SITE_NAME}`);
        if (contactRes.ok) {
          const contactJson = await contactRes.json();
          const myContact = contactJson.data?.[0];
          
          if (myContact?.Phone) {
            const cleanPhone = myContact.Phone.replace(/\D/g, '');
            setWhatsappLink(`https://wa.me/${cleanPhone}`);
          }
        }

        // 3. Fetch Domain Logo
        const res = await fetch(`${STRAPI_URL}/api/domains?filters[name][$eq]=${SITE_NAME}&populate=*`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const myDomainData = json.data?.[0];
          const rawLogo = myDomainData?.brand_logo || myDomainData?.attributes?.brand_logo;
          if (rawLogo) setLogoUrl(getStrapiMedia(rawLogo, 'small'));
        }
      } catch (error) {
        console.error("Navbar data fetch error:", error);
      }
    }
    
    fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }
  }, [mobileMenuOpen]);

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent rendering before brand config is loaded to avoid hydration mismatch/UI flickers
  if (!brand) return <div className="h-20 bg-transparent" />;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out ${
        scrolled ? 'bg-white/95 backdrop-blur-md py-2 shadow-md' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          
          {/* LOGO AREA */}
          <Link href="/" className="flex items-center gap-2 md:gap-5 group relative z-[70] min-w-0 flex-shrink">
            {logoUrl ? (
              <div className="relative h-16 w-16 md:h-32 md:w-32 transition-transform duration-300 group-hover:scale-110 -my-4 md:-my-12 flex-shrink-0">
                <Image 
                  src={logoUrl} 
                  alt={`${brand.name} Logo`} 
                  fill 
                  sizes="(max-width: 768px) 64px, 128px"
                  className="object-contain drop-shadow-md"
                  priority
                  unoptimized 
                />
              </div>
            ) : (
              <div className={`h-12 w-12 md:h-20 md:w-20 rounded-full border-4 flex-shrink-0 flex items-center justify-center font-serif italic font-black text-xl md:text-4xl transition-all shadow-lg ${
                scrolled ? 'border-stone-200 bg-white text-[#c2410c]' : 'border-white/60 text-white'
              }`}>
                {brand.name.charAt(0)}
              </div>
            )}
            
            <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-none">
              <span className={`text-sm md:text-4xl font-sans font-black italic uppercase tracking-tighter leading-tight md:leading-none transition-colors duration-500 break-words ${
                scrolled ? 'text-stone-900' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
              }`}>
                {brand.name.split(' ')[0]} 
                <span className={`${brand.colors.accent} ml-1 block sm:inline`}>
                  {brand.name.split(' ').slice(1).join(' ')}
                </span>
              </span>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-10">
            {brand.nav.map((item: any) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 py-2 ${
                    scrolled 
                      ? (isActive ? brand.colors.accent : 'text-stone-500 hover:text-stone-900')
                      : (isActive ? 'text-white' : 'text-white/60 hover:text-white')
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className={`absolute bottom-0 left-0 w-full h-0.5 transition-all ${scrolled ? brand.colors.bgAccent : 'bg-white'}`} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ACTION BUTTONS & MOBILE TOGGLE */}
          <div className="flex items-center gap-2 md:gap-3 relative z-[70]">
            <a 
              href={whatsappLink} 
              className="hidden sm:flex px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-[#1eb954] transition-all bg-[#25d366] text-white items-center gap-2"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Chat
            </a>
            
            <Link 
              href="/contact" 
              className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${brand.colors.bgAccent} text-white`}
            >
              Inquiry
            </Link>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-3 -mr-2 transition-colors ${scrolled ? 'text-stone-900' : 'text-white'}`}
              aria-label="Toggle Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between overflow-hidden">
                <span className={`h-0.5 w-full bg-current transform transition-all duration-300 origin-left ${mobileMenuOpen ? 'rotate-45 translate-x-1' : ''}`} />
                <span className={`h-0.5 w-full bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 -translate-x-full' : ''}`} />
                <span className={`h-0.5 w-full bg-current transform transition-all duration-300 origin-left ${mobileMenuOpen ? '-rotate-45 translate-x-1' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 z-[55] lg:hidden transition-opacity duration-500 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`absolute inset-0 bg-stone-900/98 backdrop-blur-2xl transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-transform ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/rocky-wall.png')]" />
        </div>

        <div className="relative h-[100dvh] flex flex-col justify-center px-8 sm:px-12 gap-5 overflow-y-auto transform-gpu">
          {brand.nav.map((item: any, idx: number) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`text-3xl sm:text-4xl font-black uppercase tracking-tighter italic transition-all duration-500 transform-gpu ${
                mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}
              style={{ transitionDelay: `${idx * 60}ms` }}
            >
              <span className={pathname === item.href ? brand.colors.accent : 'text-stone-300'}>
                {item.label}
              </span>
            </Link>
          ))}
          
          <div className={`mt-8 pt-8 border-t border-white/10 transition-all duration-700 delay-400 transform-gpu ${
            mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-black mb-4">Base Camp Logistics</p>
            <a href={`mailto:${brand.email}`} className="text-white font-serif italic text-lg block mb-3 break-all">{brand.email}</a>
            <a href={whatsappLink} className="inline-flex items-center gap-2 text-[#25d366] font-black text-sm uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#25d366] rounded-full animate-pulse" />
              Connect on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}