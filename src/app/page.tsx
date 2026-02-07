import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { STRAPI_URL, SITE_NAME, getDynamicBrand, getField, getStrapiMedia } from "@/lib/constants";
import TrustBanner from "@/components/TrustBanner";

// Force Next.js to skip the cache and re-run the logic on every visit
export const dynamic = 'force-dynamic';
export const revalidate = 0;


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
    }).join(" ");
  }
  return "";
};

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getDynamicBrand();

  if (!brand?.docId) return { title: SITE_NAME };

  try {
    // CHANGE: Use filter instead of ID in the path
    const res = await fetch(
      `${STRAPI_URL}/api/homepages?filters[domain][documentId][$eq]=${brand.docId}&populate[seo]=*`, 
      { cache: 'no-store' }
    );
    
    const json = await res.json();
    
    // homeData will be the object inside the data array
    const homeData = json.data || {}; 
    
    // getField handles the array automatically
    const seo = getField(homeData, 'SEO');

    return {
      title: getField(seo, 'meta_title') || getField(homeData, 'Hero_Title') || `${SITE_NAME}`,
      description: getField(seo, 'meta_description') || "Expert-led tours in Northern Ethiopia.",
      alternates: { canonical: `https://${SITE_NAME.toLowerCase()}` },
    };
  } catch (error) {
    return { title: SITE_NAME };
  }
}

export default async function Home() {
 //removed const brand = getBrand();
const brand = await getDynamicBrand();

  if (!brand?.docId) {
    return <div className="p-20 text-center font-black uppercase">Configuration Error: Brand ID Missing.</div>;
  }

  try {
    // Simplified population: hero_image is a direct media field
    const [homeRes, tourRes] = await Promise.all([
      fetch(`${STRAPI_URL}/api/homepages?filters[domain][documentId][$eq]=${brand.docId}&populate[TrustBanner][populate]=*&populate[featured_types][populate]=*&populate[featured_tours][populate]=*&populate=hero_image`,  { cache: 'no-store' }),
      
      fetch(`${STRAPI_URL}/api/tours?populate=*&filters[domains][name][$eq]=${SITE_NAME}`, { cache: 'no-store' })
    ]);

    if (!homeRes.ok) throw new Error("Failed to fetch Homepage");

    const homeJson = await homeRes.json();
    const tourJson = await tourRes.json();
    const homeData = homeJson.data || {};
    const allTours = tourJson.data || [];

    // --- Extract Fields ---
    const heroTitle = getField(homeData, "Hero_Title");
    const heroSubtitle = getField(homeData, "Hero_Subtitle");
    const heroImageRaw = getField(homeData, "hero_image");
    const partnerLogos = getField(homeData, "Partner_Logos");
    const founderMsg = getField(homeData, "Founder_Philosophy");
    
    // Applying the specific image logic from About Us
    const featuredImgUrl = getStrapiMedia(heroImageRaw, 'large');
    
    // Extract TrustBanner Data (Single Object Logic)
    const trustBannerData = getField(homeData, "TrustBanner") || (homeData as any).TrustBanner;

    // Extract Tours & Types
    const interestTypes = getField(homeData, "featured_types") || [];
    const strapiFeaturedTours = getField(homeData, "featured_tours");

    const hasFeatured = Array.isArray(strapiFeaturedTours) && strapiFeaturedTours.length > 0;
    const displayTours = hasFeatured ? strapiFeaturedTours : allTours;

    if (!heroTitle) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100">
             <h1 className="text-xl font-black uppercase italic text-slate-400">{SITE_NAME}</h1>
             <p className="text-slate-400 mt-2">Content update in progress...</p>
           </div>
        </div>
      );
    }

    return (
      <main className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
        {/* HERO SECTION - Adjusted alignment to sit just below menu titles */}
        <section className="relative w-full h-[75vh] flex items-start justify-center pt-16 md:pt-20 overflow-hidden bg-slate-900">
           {featuredImgUrl && (
             <Image
               src={featuredImgUrl}
               alt={heroTitle}
               fill
               className="object-cover opacity-60 scale-105"
               priority
               unoptimized
             />
           )}
           <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.9] drop-shadow-lg break-words">
                {heroTitle}<span className={brand.accent}>.</span>
              </h1>
              <p className="text-white/90 mt-6 font-medium leading-relaxed max-w-2xl mx-auto text-lg md:text-xl drop-shadow-md break-words">
                {heroSubtitle}
              </p>
           </div>
        </section>

        <div className="max-w-6xl mx-auto p-6 md:p-12">
          
          {/* FEATURED TYPES (Bucket Categories) */}
          {interestTypes.length > 0 && (
            <section className="mb-24 mt-12">
              <div className="mb-10">
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic uppercase leading-tight break-words">
                    Our Tours<span className={brand.accent}>.</span>
                 </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {interestTypes.map((type: any) => {
                  const typeImg = getField(type, 'Featured_Image');
                  const resolvedImg = getStrapiMedia(typeImg, 'medium');
                  const slug = getField(type, 'Slug');
                  
                  return (
                    <Link
                      key={type.id}
                      href={`/tours?type=${slug}`}
                      className="group relative h-96 rounded-3xl overflow-hidden bg-slate-900 shadow-md"
                    >
                        {resolvedImg && (
                          <Image
                             src={resolvedImg}
                             alt={getField(type, 'Title') || "Category"}
                             fill
                             className="object-cover opacity-60 group-hover:scale-105 transition-all duration-700"
                             unoptimized
                          />
                        )}
                        <div className="absolute inset-0 flex items-end p-8">
                           <h4 className="text-white font-black uppercase tracking-tighter text-3xl italic leading-tight break-words">
                             {getField(type, 'Title')}
                           </h4>
                        </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* FEATURED TOURS */}
          <section className="mb-24">
              <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic leading-tight break-words">
                    Selected Expeditions<span className={brand.accent}>.</span>
                 </h3>
                 <Link href="/tours" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                    View All &rarr;
                 </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {displayTours.map((tour: any) => {
                 const title = getField(tour, 'Title');
                 const slug = getField(tour, 'Slug');
                 const description = getField(tour, 'description');
                 
                 const mainImage = getField(tour, 'image');
                 const gallery = getField(tour, 'gallery');
                 const displayImage = mainImage?.url ? mainImage : (Array.isArray(gallery) ? gallery[0] : null);
                 const resolvedTourImg = getStrapiMedia(displayImage, 'medium');
                 
                 const tiers = getField(tour, 'pricing_tiers');
                 const priceArray = [
                   getField(tiers, 'tier_1'),
                   getField(tiers, 'tier_2_3'),
                   getField(tiers, 'tier_4_10'),
                   getField(tiers, 'tier_11_plus'),
                   getField(tour, 'Price_Starting_At')
                 ].filter(p => typeof p === 'number' && p > 0);
                 
                 const startingPrice = priceArray.length > 0 ? Math.min(...priceArray) : null;

                 return (
                   <div key={tour.id || slug} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl transition-all">
                     <div className="relative h-96 w-full bg-slate-200 overflow-hidden">
                       {resolvedTourImg ? (
                         <Image
                           src={resolvedTourImg}
                           alt={title || "Tour"}
                           fill
                           className="object-cover group-hover:scale-110 transition-transform duration-1000"
                           unoptimized
                         />
                       ) : (
                         <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase">No Image</div>
                       )}
                     </div>
                     <div className="p-8 flex flex-col flex-grow">
                       <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4 uppercase italic break-words">
                         {title}
                       </h2>
                       <div className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium break-words">
                         {parseStrapiBlocks(description)}
                       </div>
                       <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center">
                         <p className="text-xl font-black text-slate-900 uppercase">
                           {startingPrice ? `$${startingPrice}` : <span className="text-xs italic font-medium text-slate-400">Price upon request</span>}
                         </p>
                         <Link href={`/tours/${slug || '#'}`}>
                           <span className={`inline-flex items-center justify-center ${brand.bgAccent} text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px]`}>
                             Explore
                           </span>
                         </Link>
                       </div>
                     </div>
                   </div>
                 );
               })}
              </div>
          </section>

          {/* WHY US SECTION */}
          {trustBannerData && (
            <section className="mb-24 py-16 border-y border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                <div className="md:col-span-1">
                   <h3 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-slate-200 italic leading-none break-words">
                      Why Us
                   </h3>
                </div>

                <div className="md:col-span-3 border-l-4 border-slate-200 pl-8">
                  <h2 className="text-2xl md:text-4xl font-black uppercase italic text-slate-900 mb-6 leading-tight break-words">
                    {getField(trustBannerData, "headline")}
                  </h2>
                  
                  <div className="text-slate-600 font-medium leading-relaxed text-lg md:text-xl mb-12 break-words">
                    {getField(trustBannerData, "subheadline")}
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-8">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">A Decade of Trust</p>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                           <p className="text-2xl font-black text-slate-900 leading-none">{getField(trustBannerData, "years_experience")}+</p>
                           <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Years Experience</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                           <p className="text-2xl font-black text-slate-900 leading-none">{getField(trustBannerData, "client_count_label") || '100%'}</p>
                           <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Local Expertise</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TRUST BADGES SECTION */}
          {getField(trustBannerData, "trust_badges") && (
            <section className="mb-24 py-20 bg-stone-50 rounded-[4rem] text-center border border-stone-100 overflow-hidden">
                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-stone-500 mb-12 px-6">DELIVERING 5-STAR RATED SERVICE FOR 10 YEARS IN A ROW</p>
                <div className="flex flex-wrap justify-center items-center gap-16 px-10">
                  {getField(trustBannerData, "trust_badges").map((badge: any) => {
                    const resolvedBadgeImg = getStrapiMedia(badge, 'thumbnail');
                    return (
                      <div key={badge.id} className="relative h-32 w-32 hover:scale-110 transition-transform duration-500">
                        {resolvedBadgeImg && (
                          <Image
                            src={resolvedBadgeImg}
                            alt="Trust Badge"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
            </section>
          )}

          {/* FOUNDER PHILOSOPHY */}
          {getField(trustBannerData, "founder_image") && (
            <section className="mb-24 flex flex-col md:flex-row items-center gap-8 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl">
              <div className="relative h-32 w-32 md:h-40 md:w-40 shrink-0 rounded-full overflow-hidden border-4 border-white/20">
                <Image
                  src={getStrapiMedia(getField(trustBannerData, "founder_image"))}
                  alt="Founder"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-serif italic text-white/90 leading-tight break-words">
                  "{founderMsg}"
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">— Founder</p>
              </div>
            </section>
          )}

          {/* PARTNER LOGOS */}
          {(getField(trustBannerData, 'partner_logos') || partnerLogos) && (
             <section className="mb-24 py-20 border-t border-stone-200 text-center">
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-500 mb-12">PIONEER PARTNER FOR MAJOR GLOBAL PLATFORMS</p>
                <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700">
                   {(getField(trustBannerData, 'partner_logos') || partnerLogos).map((logo: any) => {
                     const resolvedPartnerImg = getStrapiMedia(logo, 'thumbnail');
                     return (
                       <div key={logo.id} className="relative h-24 w-56 hover:scale-105 transition-transform">
                         {resolvedPartnerImg && (
                           <Image
                             src={resolvedPartnerImg}
                             alt="Partner Logo"
                             fill
                             className="object-contain"
                             unoptimized
                           />
                         )}
                       </div>
                     );
                   })}
                </div>
             </section>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error("Home Page Fetch Error:", error);
    return (
      <div className="p-20 text-center">
        <h1 className="text-xl font-black text-slate-400">System Connection Offline</h1>
      </div>
    );
  }
}