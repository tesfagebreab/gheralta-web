import { STRAPI_URL, getBrand, getField, getStrapiMedia } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- HELPERS ---

/**
 * Renders Strapi Blocks into JSX, supporting lists, headings, and bold text
 */
const renderStrapiBlocks = (content: any) => {
  if (!content) return null;
  const blocks = content?.data?.attributes?.content || content?.content || content;
  
  if (!Array.isArray(blocks)) {
    return <p className="text-stone-600">{typeof blocks === 'string' ? blocks : ""}</p>;
  }

  return blocks.map((block: any, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-6 last:mb-0">
            {block.children?.map((child: any, i: number) => (
              <span key={i} className={child.bold ? "font-bold text-stone-900" : ""}>
                {child.text}
              </span>
            ))}
          </p>
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClasses = block.format === 'ordered' ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={index} className={`ml-6 mb-8 space-y-3 ${listClasses} text-stone-600`}>
            {block.children?.map((item: any, i: number) => (
              <li key={i} className="pl-2">
                {item.children?.map((child: any, ci: number) => (
                  <span key={ci} className={child.bold ? "font-bold text-stone-900" : ""}>
                    {child.text}
                  </span>
                ))}
              </li>
            ))}
          </ListTag>
        );

      case 'heading':
        const Level = `h${block.level || 3}` as any;
        const sizeClass = block.level === 1 ? "text-2xl" : "text-xl";
        return (
          <Level key={index} className={`${sizeClass} font-black uppercase italic tracking-tight text-stone-900 mt-10 mb-6 first:mt-0`}>
            {block.children?.map((child: any, i: number) => child.text).join("")}
          </Level>
        );

      default:
        return null;
    }
  });
};

// --- DATA FETCHING ---
async function getBookingTermsForDomain() {
const currentSite = getSiteName(); // safe in server component

  try {
    const res = await fetch(`${STRAPI_URL}/api/booking-terms?populate=*`, {
      cache: 'no-store'
    });
    const json = await res.json();
    const allTerms = json.data;

    if (!allTerms || !Array.isArray(allTerms)) return null;

    return allTerms.find((item: any) => {
      const domainData = item.domain || item.attributes?.domain;
      const domainName = domainData?.domain || domainData?.name || "";
      return domainName.toLowerCase().includes(currentSite.split(' ')[0].toLowerCase());
    });
  } catch (error) {
    console.error("Booking Terms Fetch Error:", error);
    return null;
  }
}

// --- SEO ---
export async function generateMetadata(): Promise<Metadata> {
  const currentSite = getSiteName(); // safe in server component
  const data = await getBookingTermsForDomain();
  const seo = getField(data, 'seo');
  const metaImg = getField(seo, 'meta_image');

  return {
    title: getField(seo, 'meta_title') || `Booking Terms | ${currentSite}`,
    description: getField(seo, 'meta_description') || `Travel terms for ${currentSite}`,
    openGraph: {
      images: metaImg ? [getStrapiMedia(metaImg)] : [],
    }
  };
}

export default async function BookingTermsPage() {
  const brand = getBrand();
  const data = await getBookingTermsForDomain();
  const currentSite = getSiteName();

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-[#fafaf9]">
        <h1 className="text-2xl font-black uppercase italic text-stone-400">Not Found</h1>
        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2">
           No terms linked to {currentSite}
        </p>
        <Link href="/" className="mt-8 text-[10px] font-black uppercase tracking-widest border-b-2 border-stone-900 pb-1">Return Home</Link>
      </div>
    );
  }

  const attr = data.attributes || data;
  const title = attr.title || "Booking Terms";

  return (
    <main className="bg-[#fafaf9] pt-32 pb-24 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* SMALLER BRANDED HEADER */}
        <div className="mb-10 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-stone-900 leading-none">
            {title.split(' ')[0]} 
            <span style={{ color: brand.colors.accent }}> {title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <div className={`h-1.5 w-16 ${brand.bgAccent} mt-4`}></div>
        </div>
        
        {/* CONTENT BLOCK */}
        <div className="bg-white p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-xl shadow-stone-200/40 relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/rocky-wall.png')]" />
          
          <div className="relative z-10">
            <div className="prose prose-stone prose-sandstone max-w-none">
              <div className="font-sans text-stone-600 leading-relaxed text-base md:text-lg">
                {renderStrapiBlocks(attr.content)}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stone-200 pt-10">
          <p className="text-stone-900 font-serif italic text-sm">
            {currentSite} &copy; {new Date().getFullYear()}
          </p>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Last Updated</p>
            <p className="text-stone-900 font-sans font-bold text-sm">
              {new Date(attr.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}