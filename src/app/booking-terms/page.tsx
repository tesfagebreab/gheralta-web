import { STRAPI_URL, getBrand, getField, getStrapiMedia } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- HELPERS ---

/**
 * Renders Strapi Blocks into JSX, supporting lists, headings, and bold text
 * Optimized for the Gheralta Sandstone theme
 */
const renderStrapiBlocks = (content: any) => {
  if (!content) return null;
  const blocks = content?.data?.attributes?.content || content?.content || content;
  
  if (!Array.isArray(blocks)) {
    return <p className="text-stone-600 font-medium">{typeof blocks === 'string' ? blocks : ""}</p>;
  }

  return blocks.map((block: any, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-6 last:mb-0 leading-relaxed text-stone-600 font-medium">
            {block.children?.map((child: any, i: number) => (
              <span key={i} className={child.bold ? "font-black text-stone-900" : ""}>
                {child.text}
              </span>
            ))}
          </p>
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClasses = block.format === 'ordered' ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={index} className={`ml-6 mb-8 space-y-3 ${listClasses} text-stone-600 font-medium`}>
            {block.children?.map((item: any, i: number) => (
              <li key={i} className="pl-2">
                {item.children?.map((child: any, ci: number) => (
                  <span key={ci} className={child.bold ? "font-black text-stone-900" : ""}>
                    {child.text}
                  </span>
                ))}
              </li>
            ))}
          </ListTag>
        );

      case 'heading':
        const Level = `h${block.level || 3}` as any;
        const sizeClass = block.level === 1 ? "text-3xl" : block.level === 2 ? "text-2xl" : "text-xl";
        return (
          <Level key={index} className={`${sizeClass} font-black uppercase italic tracking-tight text-stone-900 mt-12 mb-6 first:mt-0`}>
            {block.children?.map((child: any, i: number) => child.text).join("")}
          </Level>
        );

      default:
        return null;
    }
  });
};

// --- DATA FETCHING ---
export async function getBookingTermsForDomain() {
  const currentSite = await getSiteName();

  try {
    const res = await fetch(
      `${STRAPI_URL}/api/booking-terms?` +
      new URLSearchParams({
        'filters[domain][name][$eq]': currentSite,
        'populate': '*',
      }).toString(),
      { cache: 'no-store' }
    );

    if (!res.ok) return null;
    
    const json = await res.json();
    return json.data?.[0] || null;
  } catch (error) {
    console.error("Booking Terms Fetch Error:", error);
    return null;
  }
}

// --- SEO ---
export async function generateMetadata(): Promise<Metadata> {
  const currentSite = await getSiteName();
  const data = await getBookingTermsForDomain();
  const seo = getField(data, 'seo');
  const metaImg = getField(seo, 'meta_image');

  return {
    title: getField(seo, 'meta_title') || `Booking Terms | ${currentSite}`,
    description: getField(seo, 'meta_description') || `Important travel and booking information for ${currentSite}.`,
    alternates: { canonical: `https://${currentSite.toLowerCase()}/booking-terms` },
    openGraph: {
      images: metaImg ? [getStrapiMedia(metaImg)] : [],
    }
  };
}

export default async function BookingTermsPage() {
  const brand = getBrand();
  const data = await getBookingTermsForDomain();
  const currentSite = await getSiteName();

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-stone-50">
        <h1 className="text-xl font-black uppercase italic text-stone-300 tracking-tighter">Information Unavailable</h1>
        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2">
           No terms linked to {currentSite}
        </p>
        <Link href="/" className="mt-8 text-[10px] font-black uppercase tracking-widest border-b border-brand-accent pb-1 text-brand-accent">Return Home</Link>
      </div>
    );
  }

  const attr = data.attributes || data;
  const title = attr.title || "Booking Terms";

  return (
    <main className="bg-stone-50 pt-32 pb-24 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="mb-10 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-stone-900 leading-none">
            {title.split(' ')[0]} 
            <span className="text-brand-accent"> {title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <div className="h-2 w-20 bg-brand-accent mt-6"></div>
        </div>
        
        {/* CONTENT CARD */}
        <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 shadow-sm relative overflow-hidden">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/rocky-wall.png')]" />
          
          <div className="relative z-10">
            <div className="prose prose-stone max-w-none">
                {renderStrapiBlocks(attr.content)}
            </div>
          </div>
        </div>

        {/* PAGE FOOTER */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-stone-200 pt-10">
          <p className="text-stone-400 font-sans font-bold uppercase text-[10px] tracking-[0.2em]">
            {currentSite} &copy; {new Date().getFullYear()}
          </p>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-1">Document Last Updated</p>
            <p className="text-stone-900 font-sans font-black italic text-sm uppercase">
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