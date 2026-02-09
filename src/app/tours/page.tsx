"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { STRAPI_URL, getStrapiMedia, getBrand, getField } from "@/lib/constants";

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

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [filteredTours, setFilteredTours] = useState<any[]>([]);
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
        const query = `${STRAPI_URL}/api/tours?populate=*`;
        const response = await fetch(query, { cache: 'no-store', mode: 'cors' });
        
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const json = await response.json();
        const data = json.data || [];

        // Domain Filtering (Untouched)
        const domainFiltered = data.filter((tour: any) => {
          const domains = tour.domains || [];
          if (domains.length === 0) return true; 
          const targetBrand = window.location.hostname.replace('www.', '').toLowerCase().replace(/\s+/g, '');
          return domains.some((d: any) => {
            const currentName = (d.name || d.Name || d.domain || "").toLowerCase().replace(/\s+/g, '');
            return currentName.includes(targetBrand);
          });
        });

        setTours(domainFiltered);

        // --- AUTOMATIC SELECTION BASED ON URL (Untouched) ---
        const params = new URLSearchParams(window.location.search);
        const typeSlug = params.get("type");
        const diffParam = params.get("difficulty");
        const durParam = params.get("duration");

        if (typeSlug) {
          const allTypes = domainFiltered.flatMap((t: any) => getField(t, 'types') || []);
          const match = allTypes.find((ty: any) => 
            getField(ty, 'Slug') === typeSlug || 
            getField(ty, 'Title')?.toLowerCase().replace(/\s+/g, '-') === typeSlug.toLowerCase()
          );
          if (match) setFilterType(getField(match, 'Title'));
        }

        if (diffParam) setFilterDifficulty(diffParam);
        if (durParam) setFilterDuration(durParam);

      } catch (err: any) {
        console.error("CONNECTION ERROR:", err.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  // Filter Logic (Untouched)
  useEffect(() => {
    let result = tours;

    if (filterType !== "All") {
      result = result.filter(t => {
        const types = getField(t, 'types');
        return Array.isArray(types) && types.some(type => getField(type, 'Title') === filterType);
      });
    }

    if (filterDifficulty !== "All") {
      result = result.filter(t => getField(t, 'difficulty') === filterDifficulty);
    }

    if (filterDuration !== "All") {
      result = result.filter(t => {
         const dur = getField(t, 'duration') || "";
         if (filterDuration === "Short (<3 Days)") return dur.includes("1") || dur.includes("2");
         if (filterDuration === "Medium (3-6 Days)") return ["3","4","5","6"].some(d => dur.includes(d));
         if (filterDuration === "Long (7+ Days)") return ["7","8","9","10","11","12"].some(d => dur.includes(d));
         return true;
      });
    }

    setFilteredTours(result);
  }, [filterType, filterDifficulty, filterDuration, tours]);

  const uniqueTypes = Array.from(new Set(tours.flatMap(t => {
     const types = getField(t, 'types');
     return Array.isArray(types) ? types.map(ty => getField(ty, 'Title')) : [];
  }))).filter(Boolean);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400 animate-pulse">
        Loading Expeditions...
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-12 pt-24 font-sans overflow-x-hidden">
      <header className="mb-10 md:mb-16 px-2">
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight break-words">
          Our <span className="text-brand-accent">Expeditions</span>
        </h1>
        <p className="text-slate-400 mt-3 md:mt-4 font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px]">
          Curated experiences for {window.location.hostname.replace('www.', '')}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* FILTERS */}
        <aside className="w-full lg:w-48 flex-shrink-0 space-y-8 lg:space-y-10">
          <div className="px-2 lg:px-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 md:mb-6 border-b border-slate-100 pb-2">Types</h3>
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              <button onClick={() => setFilterType("All")} className="flex items-center gap-2 md:gap-3 group text-left whitespace-nowrap shrink-0">
                <div className={`w-3 h-3 md:w-4 md:h-4 rounded border transition-colors ${filterType === "All" ? brand.bgAccent : "border-slate-300 group-hover:border-brand-accent"}`} />
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${filterType === "All" ? "text-slate-900" : "text-slate-400"}`}>All Types</span>
              </button>
              {uniqueTypes.map((t: any) => (
                <button key={t} onClick={() => setFilterType(t)} className="flex items-center gap-2 md:gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded border transition-colors ${filterType === t ? brand.bgAccent : "border-slate-300 group-hover:border-brand-accent"}`} />
                  <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${filterType === t ? "text-slate-900" : "text-slate-400"}`}>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 lg:px-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 md:mb-6 border-b border-slate-100 pb-2">Difficulty</h3>
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              {["All", "Easy", "Moderate", "Challenging", "Extreme"].map((d) => (
                <button key={d} onClick={() => setFilterDifficulty(d)} className="flex items-center gap-2 md:gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded border transition-colors ${filterDifficulty === d ? brand.bgAccent : "border-slate-300 group-hover:border-brand-accent"}`} />
                  <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${filterDifficulty === d ? "text-slate-900" : "text-slate-400"}`}>{d === "All" ? "All Levels" : d}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 lg:px-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 md:mb-6 border-b border-slate-100 pb-2">Duration</h3>
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
              {["All", "Short (<3 Days)", "Medium (3-6 Days)", "Long (7+ Days)"].map((dur) => (
                <button key={dur} onClick={() => setFilterDuration(dur)} className="flex items-center gap-2 md:gap-3 group text-left whitespace-nowrap shrink-0">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded border transition-colors ${filterDuration === dur ? brand.bgAccent : "border-slate-300 group-hover:border-brand-accent"}`} />
                  <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${filterDuration === dur ? "text-slate-900" : "text-slate-400"}`}>{dur === "All" ? "All Durations" : dur}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* TOURS LIST */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 md:gap-y-16">
          {filteredTours.length > 0 ? (
            filteredTours.map((tour: any) => {
              const title = getField(tour, 'Title'); 
              const slug = getField(tour, 'Slug') || getField(tour, 'slug');
              const description = getField(tour, 'description');
              const difficulty = getField(tour, 'difficulty');
              const duration = getField(tour, 'duration');
              
              const mainImage = getField(tour, 'image');
              const gallery = getField(tour, 'gallery');
              const displayImage = mainImage?.url ? mainImage : (Array.isArray(gallery) ? gallery[0] : null);
              const resolvedImg = getStrapiMedia(displayImage, 'medium');

              const pricing = getField(tour, 'pricing_tiers');
              const prices = [
                getField(pricing, 'tier_1'),
                getField(pricing, 'tier_2_3'),
                getField(pricing, 'tier_4_10'),
                getField(pricing, 'tier_11_plus'),
                getField(tour, 'Price_Starting_At')
              ].filter(p => typeof p === 'number' && p > 0);

              const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

              return (
                <div key={tour.id} className="group flex flex-col h-full bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 shadow-sm hover:shadow-xl transition-all duration-500">
                  <Link 
                    href={`/tours/${slug}`} 
                    className="block relative h-64 md:h-72 w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-5 md:mb-6"
                  >
                    {resolvedImg ? (
                      <Image 
                        src={resolvedImg} 
                        alt={title || "Tour"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-slate-50 h-full flex items-center justify-center text-[10px] font-black uppercase text-slate-300">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 md:top-4 left-4 flex flex-wrap gap-2">
                      {difficulty && (
                        <div className="bg-black/80 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase text-white tracking-widest">
                          {difficulty}
                        </div>
                      )}
                      {duration && (
                        <div className="bg-white/90 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase text-stone-900 tracking-widest">
                          {duration}
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="px-2 md:px-4 flex-grow">
                    <Link href={`/tours/${slug}`}>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase italic mb-2 md:mb-3 leading-tight break-words group-hover:text-brand-accent transition-colors">
                        {title}
                      </h2>
                    </Link>
                    {/* Applying prose-gheralta class for rich text parsing */}
                    <div className="prose-gheralta text-slate-500 text-xs md:text-sm line-clamp-3 mb-5 md:mb-6 font-medium leading-relaxed break-words">
                      {parseStrapiBlocks(description)}
                    </div>
                  </div>

                  <div className="px-2 md:px-4 pb-2 md:pb-4 flex items-center justify-between pt-5 md:pt-6 border-t border-slate-50 mt-auto">
                    <div>
                      <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Starting From </p>
                      <p className="text-lg md:text-xl font-black text-slate-900 tracking-tighter">
                        {startingPrice ? `$${startingPrice}` : <span className="text-[10px] italic font-medium text-slate-400">Price upon request</span>}
                      </p>
                    </div>
                    
                    <Link 
                      href={`/tours/${slug}`}
                      className={`px-5 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${brand.bgAccent} text-white shadow-md active:scale-95`}
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 md:py-32 text-center border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[3rem] bg-slate-50/50 px-6">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                {error ? "Connection Failed" : "No expeditions match your filters"}
              </p>
              <button onClick={() => {setFilterType('All'); setFilterDifficulty('All'); setFilterDuration('All')}} className="mt-4 text-[9px] md:text-[10px] font-black underline uppercase text-slate-900 hover:text-brand-accent">Clear All Filters</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}