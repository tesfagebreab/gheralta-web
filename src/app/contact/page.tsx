import { Metadata } from "next";
import { STRAPI_URL, getBrand, getDynamicContact, getField, getStrapiMedia } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';
import ContactForm from "@/components/ContactForm";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- HELPERS ---

/**
 * Prevents "Objects are not valid as React child" for Rich Text fields
 */
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

// --- DYNAMIC SEO ---
export async function generateMetadata(): Promise<Metadata> {
  const currentSite = await getSiteName();

  try {
    const res = await fetch(`${STRAPI_URL}/api/contact-infos?filters[domain][name][$eq]=${currentSite}&populate=*`, { 
      cache: 'no-store'
    });
    
    if (!res.ok) return { title: `Contact | ${currentSite}` };

    const json = await res.json();
    
    // Strapi v5 Normalization: Check for attributes or direct object
    const rawData = json.data?.[0];
    const data = rawData?.attributes || rawData || {};
    
    const seo = getField(data, 'seo');
    const metaImg = getField(seo, 'meta_image');

    return {
      title: getField(seo, 'meta_title') || `Contact Us | ${currentSite}`,
      description: getField(seo, 'meta_description') || `Get in touch with the ${currentSite} team.`,
      openGraph: {
        images: metaImg ? [getStrapiMedia(metaImg)] : [],
      }
    };
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return { title: `Contact | ${currentSite}` };
  }
}

export default async function ContactPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ inquiry?: string }> 
}) {
  const brand = getBrand();
  const currentSite = await getSiteName();
  
  try {
    const resolvedParams = await searchParams;
    const initialInterest = resolvedParams?.inquiry || "";

    // Fetch dynamic phone, whatsapp, address, and email
    const contact = await getDynamicContact();

    // Standardized input styles following the sandstone palette (#c2410c)
    const inputStyles = "w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none transition-all font-medium text-stone-900 placeholder:text-stone-400 text-base";

    return (
      <main className="bg-[#fafaf9] pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen overflow-x-hidden font-sans">
         <div className="max-w-7xl mx-auto px-5 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* Left Column: Brand Info */}
            <div className="flex flex-col justify-center">
               <h1 className="text-4xl md:text-7xl font-black italic text-stone-900 mb-6 md:mb-8 leading-[0.95] md:leading-[0.9] uppercase tracking-tighter break-words">
                 Start Your <br/>
                 <span className={brand.accent}>Journey</span>
               </h1>
               <p className="text-base md:text-xl text-stone-600 mb-8 md:mb-12 max-w-md leading-relaxed font-medium break-words">
                 Whether you are ready to book an expedition or have questions about the Gheralta terrain, our local experts are here to guide you.
               </p>

               <div className="space-y-4 md:space-y-6">
                 {/* WhatsApp / Phone Card */}
                 <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                     <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2 md:mb-3">WhatsApp / Phone</h3>
                     <p className="text-xl md:text-2xl font-black text-stone-900 mb-2 break-all">{contact.phone || "Contact via WhatsApp"}</p>
                     <a 
                       href={contact.whatsapp || "#"} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="inline-flex items-center text-[#25d366] font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:opacity-80 transition-opacity"
                     >
                       Chat with us now →
                     </a>
                 </div>
                 
                 {/* Direct Email Card */}
                 <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                     <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2 md:mb-3">Direct Email</h3>
                     <p className="text-xl md:text-2xl font-black text-stone-900 mb-1 break-all">{contact.email}</p>
                     <p className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Official {brand.name} Inbox</p>
                 </div>

                 {/* Location Card */}
                 <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                     <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2 md:mb-3">Basecamp Location</h3>
                     <div className="text-lg md:text-xl font-black text-stone-900 leading-snug break-words">
                       {parseStrapiBlocks(contact.address) || "Gheralta Mountains, Ethiopia"}
                     </div>
                     <p className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">Open Daily for Expeditions</p>
                 </div>
               </div>
            </div>

            {/* Right Column: Inquiry Form Card */}
            <div className="bg-white rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 shadow-2xl shadow-stone-200 border border-stone-50 h-fit">
               <div className="mb-8 md:mb-10">
                  <h2 className="text-2xl md:text-3xl font-black italic text-stone-900 uppercase tracking-tighter">Send Inquiry</h2>
                  <div className={`h-1.5 w-12 ${brand.bgAccent} mt-2`}></div>
               </div>
               
               <ContactForm 
                 brand={brand} 
                 initialInterest={initialInterest} 
                 inputStyles={inputStyles} 
                 siteName={currentSite}
               />

               <p className="text-[9px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-8 md:mt-10 text-center px-4 leading-loose">
                 We typically respond to all adventure inquiries within 12 hours.
               </p>
            </div>

         </div>
      </main>
    );
  } catch (error) {
    console.error("CONTACT PAGE RENDER ERROR:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-[#fafaf9]">
        <h1 className="text-2xl font-black uppercase italic text-red-500 tracking-tighter">Connection Error</h1>
        <p className="text-stone-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-2">Checking Connection for {currentSite}...</p>
        <Link href="/" className="mt-8 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b-2 border-stone-200 pb-1 text-stone-900">Return Home</Link>
      </div>
    );
  }
}