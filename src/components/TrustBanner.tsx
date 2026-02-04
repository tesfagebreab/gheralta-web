import Image from "next/image";
import { getField, getStrapiMedia } from "@/lib/constants";

interface TrustBannerProps {
  data: any;
  brand: {
    colors: {
      accent: string;
      bgAccent: string;
    }
  };
}

export default function TrustBanner({ data, brand }: TrustBannerProps) {
  // 1. Safety guard
  if (!data) return null;

  // 2. Data Extraction
  const headline = getField(data, "headline") || "";
  const subheadline = getField(data, "subheadline") || "";
  const yearsExp = getField(data, "years_experience") || 0;
  const clientLabel = getField(data, "client_count_label") || "2500 Global Travelers";
  
  const badges = getField(data, "trust_badges");
  const logos = getField(data, "partner_logos");
  const founderImg = getField(data, "founder_image");

  // 3. Resolve Media
  const founderImgUrl = getStrapiMedia(founderImg);

  // 4. Safe Label Splitting
  const labelParts = clientLabel ? String(clientLabel).split(' ') : ["", ""];
  const clientNumber = labelParts[0];
  const clientText = labelParts.slice(1).join(' ');

  const safeMap = (items: any) => {
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  };

  return (
    <section className="bg-slate-900 py-16 md:py-24 text-white overflow-hidden rounded-[2.5rem] md:rounded-[4rem] my-8 md:my-12 mx-4 md:mx-0 shadow-2xl">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center mb-16 md:mb-20">
          {/* Text Content */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <h2 className="text-3xl md:text-6xl font-black italic tracking-tighter leading-[1] md:leading-[0.9] mb-6 md:mb-8 uppercase">
              {headline}
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
              {subheadline}
            </p>
            
            <div className="flex gap-8 md:gap-12 mt-8 md:mt-10">
              {/* Experience Metric */}
              <div>
                <p className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: brand.colors.accent }}>
                  {yearsExp}+
                </p>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Years Excellence</p>
              </div>

              {/* Client Metric */}
              <div>
                <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {clientNumber}
                </p>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                  {clientText}
                </p>
              </div>
            </div>
          </div>

          {/* Founder Image Display */}
          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <div className="relative z-10 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-slate-800 aspect-[4/5] shadow-2xl bg-slate-800">
              {founderImgUrl ? (
                <Image 
                  src={founderImgUrl}
                  alt="Founder"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center italic text-slate-600">
                  No Image
                </div>
              )}
            </div>
            
            <div 
              className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-full h-full rounded-[2rem] md:rounded-[3rem] opacity-20 -z-0"
              style={{ backgroundColor: brand.colors.accent }}
            ></div>
          </div>
        </div>

        {/* Footer Area: Logos & Badges */}
        <div className="pt-12 md:pt-16 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              {safeMap(badges).map((badge: any, idx: number) => {
                const badgeUrl = getStrapiMedia(badge);
                if (!badgeUrl) return null;
                return (
                  <div key={badge.id || `badge-${idx}`} className="relative h-10 w-20 md:h-12 md:w-24">
                    <Image 
                      src={badgeUrl} 
                      alt="Trust Badge" 
                      fill 
                      className="object-contain" 
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>

            {/* Partner Logos */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {safeMap(logos).map((logo: any, idx: number) => {
                const logoUrl = getStrapiMedia(logo);
                if (!logoUrl) return null;
                return (
                  <div key={logo.id || `logo-${idx}`} className="relative h-6 w-24 md:h-8 md:w-28 opacity-30 hover:opacity-100 transition-opacity">
                     <Image 
                      src={logoUrl} 
                      alt="Partner Logo" 
                      fill 
                      className="object-contain" 
                      unoptimized 
                    />
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}