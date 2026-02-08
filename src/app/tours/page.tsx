"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia, getBrand, getField } from "@/lib/constants";
import { fetchAPI } from "@/lib/strapi";

// --- HELPERS ---

const parseStrapiBlocks = (content: any): string => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  const blocks = content.document || content.json || (Array.isArray(content) ? content : null);
  if (Array.isArray(blocks)) {
    return blocks.map(block => {
      if (block.children && Array.isArray(block.children)) {
        return block.children.map((child: any) => child.text || "").join("");
      }
      return "";
    }).join(" ");
  }
  return "";
};

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const brand = getBrand();

  // Filters State
  const [filterType, setFilterType] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterDuration, setFilterDuration] = useState("All");

  useEffect(() => {
    async function fetchTours() {
      try {
        // Using optimized fetchAPI with targeted population for speed
        const response = await fetchAPI('/tours', {
          populate: {
            image: { populate: '*' },
            gallery: { populate: '*' },
            types: { populate: '*' },
            domains: { populate: '*' },
            pricing_tiers: { populate: '*' }
          },
          sort: ['createdAt:desc']
        }, { cache: 'no-store' });
        
        const data = response?.data || [];
        const targetBrand = typeof window !== 'undefined' ? window.location.hostname.replace('www.', '').toLowerCase() : "";

        // Fast Domain Filtering and Data Normalization in one pass
        const domainFiltered = data.filter((tour: any) => {
          const attr = tour.attributes || tour;
          const domains = attr.domains?.data || attr.domains || [];
          if (domains.length === 0) return true; 
          
          return domains.some((d: any) => {
            const dAttr = d.attributes || d;
            const currentName = (dAttr.name || dAttr.domain || "").toLowerCase();
            return currentName.includes(targetBrand);
          });
        });

        setTours(domainFiltered);

        // Parse URL params for deep-linked filtering
        const params = new URLSearchParams(window.location.search);
        const typeSlug = params.get("type");
        if (typeSlug) {
          const allTypes = domainFiltered.flatMap((t: any) => getField(t, 'types') || []);
          const match = allTypes.find((ty: any) => 
            getField(ty, 'Slug') === typeSlug || 
            getField(ty, 'Title')?.toLowerCase().replace(/\s+/g, '-') === typeSlug.toLowerCase()
          );
          if (match) setFilterType(getField(match, 'Title'));
        }
        
        if (params.get("difficulty")) setFilterDifficulty(params.get("difficulty")!);
        if (params.get("duration")) setFilterDuration(params.get("duration")!);

      } catch (err: any) {
        console.error("CONNECTION ERROR:", err.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  // Memoized Filter Logic for UI Speed
  const filteredTours = useMemo(() => {
    return tours.filter(t => {
      const typeMatch = filterType === "All" || 
        (Array.isArray(getField(t, 'types')) && getField(t, 'types').some((type: any) => getField(type, 'Title') === filterType));
      
      const diffMatch = filterDifficulty === "All" || getField(t, 'difficulty') === filterDifficulty;
      
      const dur = getField(t, 'duration') || "";
      let durMatch = true;
      if (filterDuration === "Short (<3 Days)") durMatch = dur.includes("1") || dur.includes("2");
      else if (filterDuration === "Medium (3-6 Days)") durMatch = ["3","4","5","6"].some(d => dur.includes(d));
      else if (filterDuration === "Long (7+ Days)") durMatch = ["7","8","9","10","11","12"].some(d => dur.includes(d));

      return typeMatch && diffMatch && durMatch;
    });
  }, [filterType, filterDifficulty, filterDuration, tours]);

  const uniqueTypes = useMemo(() => {
    const types = tours.flatMap(t => {
      const tData = getField(t, 'types');
      return Array.isArray(tData) ? tData.map(ty => getField(ty, 'Title')) : [];
    });
    return Array.from(new Set(types)).filter(Boolean);
  }, [tours]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className={`w-8 h-8 border-2 ${brand.accent.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} />
        <div className="font-black uppercase text-[10px] tracking-widest text-slate-400">Syncing Adventures...</div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-12 pt-24 font-sans overflow-x-hidden">
      <header className="mb-12 md:mb-20 px-2">
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 uppercase italic tracking-tighter leading-[0.85] break-words">
          Our <span className={brand.accent}>Expeditions</span>
        </h1>
        <p className="text-slate-400 mt-6 font-bold uppercase tracking-[0.4em] text-[9px] md:text-[11px] flex items-center gap-4">
          <span className={`w-8 h-[2px] ${brand.bgAccent}`} />
          {typeof window !== 'undefined' ? window.location.hostname.replace('www.', '') : "Gheralta"}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-56 flex-shrink-0 space-y-12">
          <div className="px-2 lg:px-0">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 border-b border-slate-100 pb-3">Types</h3>
            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              {["All", ...uniqueTypes].map((t: any) => (
                <button key={t} onClick={() => setFilterType(t)} className="flex items-center gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-4 h-4 rounded-md border-2 transition-all ${filterType === t ? `${brand.bgAccent} border-transparent scale-110` : "border-slate-200 group-hover:border-orange-300"}`} />
                  <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${filterType === t ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`}>
                    {t === "All" ? "All Experiences" : t}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 lg:px-0">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 border-b border-slate-100 pb-3">Challenge</h3>
            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              {["All", "Easy", "Moderate", "Challenging", "Extreme"].map((d) => (
                <button key={d} onClick={() => setFilterDifficulty(d)} className="flex items-center gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-4 h-4 rounded-md border-2 transition-all ${filterDifficulty === d ? `${brand.bgAccent} border-transparent scale-110` : "border-slate-200 group-hover:border-orange-300"}`} />
                  <span className={`text-[10px] font-black uppercase tracking-tight ${filterDifficulty === d ? "text-slate-900" : "text-slate-400"}`}>
                    {d === "All" ? "All Levels" : d}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 lg:px-0">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 border-b border-slate-100 pb-3">Duration</h3>
            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              {["All", "Short (<3 Days)", "Medium (3-6 Days)", "Long (7+ Days)"].map((dur) => (
                <button key={dur} onClick={() => setFilterDuration(dur)} className="flex items-center gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-4 h-4 rounded-md border-2 transition-all ${filterDuration === dur ? `${brand.bgAccent} border-transparent scale-110` : "border-slate-200 group-hover:border-orange-300"}`} />
                  <span className={`text-[10px] font-black uppercase tracking-tight ${filterDuration === dur ? "text-slate-900" : "text-slate-400"}`}>
                    {dur === "All" ? "Any Duration" : dur}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* TOURS LIST */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
          {filteredTours.length > 0 ? (
            filteredTours.map((tour: any) => {
              const attr = tour.attributes || tour;
              const title = attr.Title || attr.title; 
              const slug = attr.Slug || attr.slug;
              const difficulty = attr.Difficulty || attr.difficulty;
              const duration = attr.Duration || attr.duration;
              
              const displayImage = getField(tour, 'image') || (Array.isArray(getField(tour, 'gallery')) ? getField(tour, 'gallery')[0] : null);
              const resolvedImg = getStrapiMedia(displayImage, 'medium');

              const pricing = getField(tour, 'pricing_tiers');
              const prices = [
                getField(pricing, 'tier_1'),
                getField(pricing, 'tier_2_3'),
                getField(pricing, 'tier_4_10'),
                getField(pricing, 'tier_11_plus'),
                attr.Price_Starting_At
              ].filter(p => typeof p === 'number' && p > 0);

              const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

              return (
                <div key={tour.id || tour.documentId} className="group flex flex-col h-full">
                  <Link 
                    href={`/tours/${slug}`} 
                    className="block relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden mb-8"
                  >
                    {resolvedImg ? (
                      <Image 
                        src={resolvedImg} 
                        alt={title || "Tour"}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-slate-100 h-full w-full" />
                    )}
                    
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {difficulty && (
                        <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-slate-900 tracking-[0.2em] w-fit shadow-xl">
                          {difficulty}
                        </div>
                      )}
                      {duration && (
                        <div className="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white tracking-[0.2em] w-fit">
                          {duration}
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="px-2 flex-grow flex flex-col">
                    <Link href={`/tours/${slug}`}>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-4 leading-none group-hover:text-orange-700 transition-colors">
                        {title}
                      </h2>
                    </Link>
                    <div className="text-slate-500 text-sm line-clamp-2 mb-8 font-medium leading-relaxed italic">
                      {parseStrapiBlocks(attr.Description || attr.description)}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Price</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                          {startingPrice ? `$${startingPrice}` : <span className="text-xs italic font-bold text-slate-300">Bespoke</span>}
                        </p>
                      </div>
                      
                      <Link 
                        href={`/tours/${slug}`}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${brand.bgAccent} text-white shadow-lg group-hover:scale-110 group-hover:rotate-12`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-slate-50/30 px-6">
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                {error ? "System Offline" : "Zero Matches Found"}
              </p>
              <button 
                onClick={() => {setFilterType('All'); setFilterDifficulty('All'); setFilterDuration('All')}} 
                className={`mt-6 text-[10px] font-black uppercase tracking-widest ${brand.accent} hover:underline`}
              >
                Reset Exploration Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}