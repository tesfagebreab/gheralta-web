export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { STRAPI_URL, getBrand, getField, getStrapiMedia } from "@/lib/constants";

import { getSiteName } from '@/lib/server-utils';
import TrustBanner from "@/components/TrustBanner";

// --- HELPERS ---

const parseStrapiBlocks = (content: any): string => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(block => {
      if (block.children && Array.isArray(block.children)) {
        return block.children.map((child: any) => child.text || "").join("");
      }
      return "";
    }).join("\n\n");
  }
  return "";
};

const parseStrapiList = (content: any): string[] => {
  if (!Array.isArray(content)) return [];
  return content
    .filter(block => block.type === 'list')
    .flatMap(block => 
      block.children?.map((item: any) => 
        item.children?.map((child: any) => child.text || "").join("")
      ) || []
    ).filter(text => typeof text === 'string' && text.trim() !== "");
};

// --- DYNAMIC SEO ---
export async function generateMetadata(): Promise<Metadata> {
  const currentSite = getSiteName()
  try {
    const res = await fetch(`${STRAPI_URL}/api/about-uses?filters[domain][name][$eq]=${currentSite}`, { 
      cache: 'no-store'
    });
    const json = await res.json();
    const data = json.data?.[0] || {};
    const seo = getField(data, 'seo');
    const metaImg = getField(seo, 'meta_image');

    return {
      title: getField(seo, 'meta_title') || `Our Story | ${currentSite}`,
      description: getField(seo, 'meta_description') || `Discover the mission behind ${currentSite}.`,
      openGraph: {
        images: metaImg ? [getStrapiMedia(metaImg)] : [],
      }
    };
  } catch (error) {
    return { title: `About Us | ${currentSite}` };
  }
}

export default async function AboutUs({ 
    searchParams 
  }: { 
    searchParams: Promise<{ inquiry?: string }> 
  }) {
  await searchParams;
  const brand = getBrand();
  const currentSite = getSiteName()
  
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/about-uses?filters[domain][name][$containsi]=${currentSite}&populate[0]=trust_banner&populate[1]=trust_banner.trust_badges&populate[2]=trust_banner.partner_logos&populate[3]=trust_banner.founder_image&populate[4]=featured_image&populate[5]=seo`, 
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error(`Failed to connect to Strapi: ${res.status}`);

    const json = await res.json();
    const data = (json.data && json.data.length > 0) ? json.data[0] : null;
    if (!data) throw new Error(`No data found for domain: ${currentSite}`);

    const pageContent = {
      title: String(getField(data, "hero_title") || "Our Story"),
      subtitle: String(getField(data, "hero_subtitle") || ""),
      philosophy: parseStrapiBlocks(getField(data, "founder_philosophy")),
      values: parseStrapiList(getField(data, "our_values")), 
      image: getField(data, "featured_image"), 
    };

    const trustBannerData = getField(data, "trust_banner");
    const extractArray = (field: any) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (field.data && Array.isArray(field.data)) return field.data;
        return [];
    };

    const badgesArray = extractArray(getField(trustBannerData, "trust_badges"));
    const logosArray = extractArray(getField(trustBannerData, "partner_logos"));
    const featuredImgUrl = getStrapiMedia(pageContent.image, 'large');

    return (
      <main className="min-h-screen bg-[#fafaf9] font-sans selection:bg-orange-200 overflow-x-hidden">
        
        {/* --- CINEMATIC HERO --- */}
        <section className="relative h-screen min-h-[600px] md:min-h-[700px] flex items-center pt-24 md:pt-32 pb-24 overflow-hidden">
          {featuredImgUrl && (
            <Image 
              src={featuredImgUrl} 
              alt={pageContent.title} 
              fill 
              priority
              className="object-cover scale-105" 
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full">
            <div className="max-w-4xl">
                <span className="inline-block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-orange-500 mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
                    Established Excellence
                </span>
                
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.9] md:leading-[0.85] mb-8 break-words drop-shadow-2xl">
                  {pageContent.title}
                </h1>
                
                <p className="text-lg md:text-2xl text-stone-200 max-w-2xl leading-relaxed font-light border-l border-white/30 pl-6 md:pl-8 drop-shadow-lg">
                    {pageContent.subtitle}
                </p>
            </div>
          </div>
        </section>

        {/* --- PHILOSOPHY & FOUNDER SECTION --- */}
        <section className="py-24 md:py-40 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="grid lg:grid-cols-12 gap-16 md:gap-24 items-center">
                <div className="lg:col-span-5 relative">
                    <div className="absolute -top-8 -left-8 md:-top-12 md:-left-12 w-48 h-48 md:w-64 md:h-64 bg-stone-100 rounded-full -z-10" />
                    <div className="relative aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl md:rotate-2 hover:rotate-0 transition-transform duration-700">
                        {getField(trustBannerData, "founder_image") && (
                            <Image 
                                src={getStrapiMedia(getField(trustBannerData, "founder_image"))} 
                                alt="Our Founder" 
                                fill 
                                className="object-cover"
                                unoptimized
                            />
                        )}
                    </div>
                    <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-stone-900 text-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-xl max-w-[180px] md:max-w-[240px]">
                        <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Years Active</p>
                        <p className="text-3xl md:text-5xl font-black italic tracking-tighter" style={{ color: brand.colors.accent }}>
                            {getField(trustBannerData, "years_experience")}+
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-7 mt-12 lg:mt-0">
  {/* Smaller, more elegant label with brand accent color */}
  <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-700 mb-6 block">
    Our Founding Commitment
  </h3>

  {/* Reduced size, lighter weight, and improved line height for a 'classier' feel */}
  <blockquote className="text-2xl md:text-4xl font-medium serif italic text-stone-800 leading-snug mb-8 break-words">
    “{pageContent.philosophy}”
  </blockquote>

  {/* Refined footer with your brand's sandstone/burnt clay tones */}
  <div className="flex items-center gap-4">
    <div className="h-[1px] w-8 md:w-12 bg-stone-300" />
    <span className="text-stone-500 italic serif text-sm md:text-base tracking-wide">
      Founder
    </span>
  </div>
</div>
            </div>
          </div>
        </section>

        {/* --- REDESIGNED TRUST BANNER (Badges Section) --- */}
        {trustBannerData && (
          <section className="bg-stone-50 py-24 md:py-40 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="grid lg:grid-cols-2 gap-16 md:gap-32 items-end mb-24 md:mb-32">
                <div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-stone-900 mb-8 md:mb-10 leading-[0.9]">
                    {getField(trustBannerData, "headline")}
                  </h2>
                  <div className="w-20 md:w-24 h-2 mb-8 md:mb-10" style={{ backgroundColor: brand.colors.accent }} />
                  <p className="text-xl md:text-2xl text-stone-500 leading-relaxed font-light">
                    {getField(trustBannerData, "subheadline")}
                  </p>
                </div>
                <div className="bg-stone-900 p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-white">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-8">Service Impact</p>
                    <div className="space-y-12">
                        <div>
                            <span className="text-5xl md:text-7xl font-black italic block leading-none" style={{ color: brand.colors.accent }}>
                                {getField(trustBannerData, "client_count_label") || "Global"}
                            </span>
                            
                        </div>
                    </div>
                </div>
              </div>

              {/* TRUST BADGE WALL */}
              <div className="border-t border-stone-200 pt-16 md:pt-20">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-stone-400 mb-12 md:mb-16 text-center">DELIVERING 5-STAR RATED SERVICE FOR 10 YEARS IN A ROW</p>
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24 opacity-80 hover:opacity-100 transition-all duration-700">
                    {badgesArray.map((badge: any, idx: number) => (
                      <div key={badge.id || idx} className="relative h-20 w-20 md:h-32 md:w-32 hover:scale-110 transition-transform">
                        <Image 
                          src={getStrapiMedia(badge, 'thumbnail')} 
                          alt="Badge" fill className="object-contain" unoptimized
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

{/* --- THE PILLARS (CORE VALUES) --- */}
{pageContent.values.length > 0 && (
  <section className="py-24 md:py-32 bg-white">
    <div className="max-w-6xl mx-auto px-6 md:px-8">
      <div className="text-center mb-16 md:mb-24">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-6">Our Core Pillars</h3>
        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-stone-900">
          How We <span style={{ color: brand.colors.accent }}>Lead</span>
        </h2>
      </div>

      {/* Changed to grid-cols-1 to make boxes much wider */}
      <div className="grid grid-cols-1 gap-px bg-stone-100 border border-stone-100 rounded-[2rem] md:rounded-[3rem] overflow-hidden">
        {pageContent.values.map((value, idx) => {
          const [label, ...rest] = value.split(':');
          const description = rest.join(':').trim();

          return (
            <div key={idx} className="bg-white p-8 md:p-12 hover:bg-[#fafaf9] transition-colors group flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              
              {/* HEADER (Label): Reduced size from 7xl to 4xl/5xl and set a fixed width on desktop to prevent stretching */}
              <div className="md:w-1/3">
                <span className="text-stone-100 font-black text-4xl md:text-5xl transition-colors group-hover:text-orange-500/20 leading-none uppercase italic tracking-tighter inline-block">
                  {label}
                </span>
              </div>

              {/* BODY (Description): Reduced size to text-lg/xl and kept bold/italic */}
              <div className="md:w-2/3">
                <h4 className="text-stone-800 font-bold italic text-base md:text-lg leading-relaxed uppercase tracking-wide group-hover:translate-x-2 transition-transform duration-500">
                  {description}
                </h4>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  </section>
)}

        {/* --- PARTNER LOGOS SECTION --- */}
        {logosArray.length > 0 && (
          <section className="py-20 md:py-32 bg-stone-50 border-t border-stone-200">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-12 md:mb-16 text-center">PIONEER PARTNER FOR MAJOR GLOBAL PLATFORMS</p>
               <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    {logosArray.map((logo: any, idx: number) => (
                      <div key={logo.id || idx} className="relative h-16 w-32 md:h-24 md:w-56 hover:scale-105 transition-transform">
                        <Image 
                          src={getStrapiMedia(logo, 'thumbnail')} 
                          alt="Partner" fill className="object-contain" unoptimized
                        />
                      </div>
                    ))}
                </div>
            </div>
          </section>
        )}

        {/* --- CALL TO ACTION --- */}
        <section className="relative py-40 md:py-60 text-center bg-stone-900 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <Image 
                    src={featuredImgUrl || ""} 
                    alt="Background" 
                    fill 
                    className="object-cover grayscale"
                    unoptimized
                />
            </div>
            <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8">
                <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter mb-12 md:mb-16 leading-[1] md:leading-[0.9]">
                    Ready to write <br className="hidden md:block"/>your own <span style={{ color: brand.colors.accent }}>story?</span>
                </h2>
                <Link 
                    href="/tours" 
                    className="group relative inline-flex items-center gap-6 md:gap-8 text-white px-10 md:px-12 py-5 md:py-6 rounded-full font-black uppercase tracking-widest text-xs md:text-sm transition-all overflow-hidden"
                    style={{ backgroundColor: brand.colors.accent }}
                >
                    <span className="relative z-10">Start Your Journey Now!</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
            </div>
        </section>
      </main>
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center px-6">
            <h1 className="text-xl font-black uppercase italic text-stone-400 mb-4">Content Unavailable</h1>
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-stone-900 pb-1">Return Home</Link>
        </div>
      </div>
    );
  }
}