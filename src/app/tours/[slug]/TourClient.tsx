"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { notFound, useParams, useRouter } from "next/navigation";
import { getBrand } from "@/lib/constants";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi";
import { addToCart, getCart } from "@/lib/cart";
import { Clock, Mountain, Map, MapPin, CheckCircle, Briefcase, Calendar } from "lucide-react";
import React from 'react';
import TourGallery from "@/components/TourGallery"; 

// --- HELPERS ---

/**
 * Advanced Block Parser for Strapi v5
 * Handles Bold, Italic, Underline, Text Alignment, and Hyperlinks
 */
const renderStrapiBlocks = (content: any) => {
  if (!content) return null;
  
  // Support for various Strapi block formats
  const blocks = content.document || content.json || (Array.isArray(content) ? content : null);
  if (!Array.isArray(blocks)) return null;

  return blocks.map((block: any, index: number) => {
    const alignmentClass = block.textAlign === 'center' ? 'text-center' : 
                           block.textAlign === 'right' ? 'text-right' : 'text-left';

    const renderLeaf = (child: any, i: number): React.ReactNode => {
      let classes = "";
      if (child.bold) classes += " font-black";
      if (child.italic) classes += " italic";
      if (child.underline) classes += " underline decoration-orange-500/30";
      if (child.strikethrough) classes += " line-through";
      if (child.code) classes += " font-mono bg-slate-100 px-1 rounded";

      if (child.type === 'link') {
        return (
          <a 
            key={i} 
            href={child.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-600 underline hover:text-orange-800 transition-colors inline-flex items-center gap-1"
          >
            {child.children?.map((c: any, j: number) => renderLeaf(c, j))}
          </a>
        );
      }

      return (
        <span key={i} className={classes}>
          {child.text}
        </span>
      );
    };

    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className={`${alignmentClass} mb-4 leading-relaxed break-words`}>
            {block.children?.map((child: any, i: number) => renderLeaf(child, i))}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${block.level || 3}` as keyof React.JSX.IntrinsicElements;
        const headingSizes: Record<number, string> = {
          1: "text-3xl md:text-5xl lg:text-6xl font-black uppercase mb-6 italic tracking-tighter leading-[0.9] break-words",
          2: "text-2xl md:text-4xl font-black uppercase mb-5 italic tracking-tight leading-tight break-words",
          3: "text-xl md:text-3xl font-black uppercase mb-4 italic leading-tight break-words",
          4: "text-lg md:text-xl font-bold mb-3 leading-snug break-words",
        };
        return (
          <HeadingTag key={index} className={`${alignmentClass} ${headingSizes[block.level || 3]}`}>
            {block.children?.map((child: any, i: number) => renderLeaf(child, i))}
          </HeadingTag>
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClass = block.format === 'ordered' ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={index} className={`${listClass} ml-6 mb-6 space-y-2 ${alignmentClass}`}>
            {block.children?.map((listItem: any, i: number) => (
              <li key={i} className="pl-2 break-words">
                {listItem.children?.map((child: any, j: number) => 
                   child.children 
                   ? child.children.map((c: any, k: number) => renderLeaf(c, k))
                   : renderLeaf(child, j)
                )}
              </li>
            ))}
          </ListTag>
        );

      default:
        return null;
    }
  });
};

const safeText = (val: any, newLine: boolean = false) => {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    const items = val.map(item => item.Name || item.title || item.Title || item.Label || item.DayTitle || "").filter(Boolean);
    return newLine ? items.join("\n") : items.join(", ");
  }
  return val.Name || val.title || val.Title || "";
};

export default function TourDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const brand = getBrand();
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isInCart, setIsInCart] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");

  useEffect(() => {
    async function fetchTour() {
      if (!slug) return;
      try {
        // Optimized Strapi v5 query structure to prevent 400 errors
        const response = await fetchAPI('/tours', {
          filters: {
            slug: { $eqi: slug }
          },
          populate: {
            DailyPlan: { populate: '*' },
            pricing_tiers: { populate: '*' },
            Gallery: { populate: '*' },
            destinations: { populate: '*' },
            types: { populate: '*' },
            tags: { populate: '*' },
            SEO: { populate: { populate: '*' } } // Correct Strapi v5 nested population
          }
        }, { cache: "no-store" });

        const rawEntry = response?.data?.[0];

        if (!rawEntry) {
          setLoading(false);
          return;
        }

        // Handle Strapi v5 data flattening
        const attr = rawEntry.attributes || rawEntry;

        setTour({
          ...attr,
          documentId: rawEntry.documentId || attr.documentId || rawEntry.id,
          Title: attr.Title || attr.title || "Tour Adventure",
          Description: attr.Description || attr.description,
          Inclusions: attr.Inclusions || attr.inclusions,
          WhatToBring: attr.WhatToBring || attr.what_to_bring,
          DailyPlan: attr.DailyPlan || [],
          Pricing_Tiers: attr.pricing_tiers || attr.Pricing_Tiers || {},
          Gallery: attr.Gallery || [],
          Image: (attr.Gallery && attr.Gallery.length > 0) ? attr.Gallery[0] : null,
          Difficulty: attr.Difficulty || attr.difficulty || "",
          Duration: attr.Duration || attr.duration || "",
          Destinations: attr.Destinations || attr.destinations || [],
          Tags: attr.Tags || attr.tags || [],
          Types: attr.Types || attr.types || []
        });

        setIsInCart(getCart().includes(rawEntry.documentId || rawEntry.id || ""));
      } catch (err) {
        console.error("Fetch error on Tour Detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTour();
  }, [slug]);

  const handleToggleCart = () => {
    if (isInCart) {
      router.push(`/checkout`);
    } else {
      if (tour?.documentId) {
        addToCart(tour.documentId);
        setIsInCart(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    
    // Safety check for form indices
    const payload = {
      type: "INQUIRY",
      siteName: typeof window !== "undefined" ? window.location.hostname.replace('www.', '').toLowerCase() : "gheralta",
      data: {
        tourTitle: tour?.Title || "General Inquiry",
        fullName: (form.elements[0] as HTMLInputElement).value || "",
        travelers: (form.elements[1] as HTMLInputElement).value || "1",
        email: (form.elements[2] as HTMLInputElement).value || "",
        phone: (form.elements[3] as HTMLInputElement).value || "",
        arrivalDate: (form.elements[4] as HTMLInputElement).value || "",
        departureDate: (form.elements[5] as HTMLInputElement).value || "",
        message: (form.elements[6] as HTMLTextAreaElement).value || "",
      }
    };

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSubmitted(true); 
        form.reset();
      }
    } catch (err) {
      console.error("Inquiry Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className={`w-12 h-12 border-4 ${brand.accent.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} />
      <div className="font-bold text-xs text-slate-400 uppercase tracking-widest animate-pulse">Loading Expedition...</div>
    </div>
  );
  
  if (!tour) return notFound();

  const tiers = tour.Pricing_Tiers || {};
  const priceArray = [tiers?.tier_1, tiers?.tier_2_3, tiers?.tier_4_10, tiers?.tier_11_plus].filter(p => p != null && typeof p === 'number') as number[];
  const startingPrice = priceArray.length > 0 ? Math.min(...priceArray) : (typeof tour.Price_Starting_At === 'number' ? tour.Price_Starting_At : null);
  const hasPricing = startingPrice !== null;
  const itinerary = Array.isArray(tour.DailyPlan) ? tour.DailyPlan : [];
  const gallery = Array.isArray(tour.Gallery) ? tour.Gallery : [];
  
  const galleryImages = gallery.map((img: any) => ({
    url: getStrapiMedia(img.url || img) || "",
    alternativeText: img.alternativeText || img.caption || tour.Title || "Gallery Image"
  })).filter((img: any) => img.url !== "");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/tours" className={`${brand.accent} font-black hover:underline transition-all uppercase text-[10px] tracking-widest`}>
          ← Back to Tours
        </Link>
        <span className="font-black italic tracking-tighter uppercase text-slate-400">
          {(brand.name || "Tour").split(' ')[0]}.
        </span>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[70vh] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        {tour.Image && (
          <Image 
            src={getStrapiMedia(tour.Image.url || tour.Image) || ""} 
            alt={tour.Title || "Hero"} 
            fill 
            className="object-cover opacity-60 scale-105" 
            priority 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {(Array.isArray(tour.Tags) ? tour.Tags : []).map((tag: any, i: number) => (
              <span key={i} className="bg-white/10 backdrop-blur-md text-white text-[8px] md:text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20">
                {safeText(tag).trim()}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white italic uppercase tracking-tighter max-w-5xl leading-[0.85] break-words drop-shadow-2xl">
            {tour.Title}
          </h1>
          <div className="flex items-center gap-4 mt-8">
            <div className="h-px w-12 bg-orange-500/50" />
            <p className="text-white/70 font-bold uppercase tracking-[0.5em] text-[10px] md:text-xs">
              {safeText(tour.Destinations) || "Ethiopia"}
            </p>
            <div className="h-px w-12 bg-orange-500/50" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { label: "Duration", value: safeText(tour.Duration), icon: <Clock size={18} /> },
              { label: "Difficulty", value: safeText(tour.Difficulty), icon: <Mountain size={18} /> },
              { label: "Expedition", value: safeText(tour.Types, true), icon: <Map size={18} /> },
              { label: "Territory", value: safeText(tour.Destinations, true), icon: <MapPin size={18} /> }
            ].map((fact, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                <span className={`${brand.accent} mb-3 block group-hover:scale-110 transition-transform`}>{fact.icon}</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{fact.label}</p>
                <div className="font-bold text-slate-900 text-xs md:text-sm whitespace-pre-line leading-tight">{fact.value || "Request Info"}</div>
              </div>
            ))}
          </div>

          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8 text-slate-900">The Journey <span className={brand.accent}>Wait</span></h2>
          <div className={`text-lg md:text-xl text-slate-600 leading-relaxed border-l-4 ${brand.accent.replace('text-', 'border-')}/20 pl-8 mb-20 font-medium`}>
            {renderStrapiBlocks(tour.Description) || "A masterpiece of local travel knowledge, this description is currently being refined by our team."}
          </div>

          <div className="mb-16">
            <div className="flex gap-10 border-b border-slate-100 mb-10 overflow-x-auto no-scrollbar">
              {[
                { id: "itinerary", label: "Itinerary", icon: <Calendar size={14} /> },
                { id: "inclusions", label: "Inclusions", icon: <CheckCircle size={14} /> },
                { id: "bring", label: "Gear List", icon: <Briefcase size={14} /> }
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`pb-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 whitespace-nowrap relative ${activeTab === t.id ? `${brand.accent}` : "text-slate-300 hover:text-slate-500"}`}
                >
                  {t.icon} {t.label}
                  {activeTab === t.id && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${brand.bgAccent} animate-in slide-in-from-left duration-300`} />}
                </button>
              ))}
            </div>
            
            <div className="min-h-[400px]">
              {activeTab === "itinerary" && (
                <div className="relative border-l-2 border-slate-100 ml-4 md:ml-8 space-y-16">
                  {itinerary.length > 0 ? itinerary.map((day: any, index: number) => (
                    <div key={index} className="relative pl-12 group">
                      <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all group-hover:scale-125 ${brand.bgAccent}`} />
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase ${brand.accent} tracking-widest mb-2`}>Day {index + 1}</span>
                        <h3 className="font-black italic uppercase text-2xl md:text-3xl text-slate-900 mb-4 tracking-tighter leading-none break-words">
                          {day.DayTitle || "Exploring Wilderness"}
                        </h3>
                        <div className="text-slate-500 leading-relaxed text-base md:text-lg max-w-2xl break-words font-medium">
                          {renderStrapiBlocks(day.Activities) || "Deep exploration of the ancient sandstone routes."}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="pl-12 py-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                       <p className="text-slate-400 italic text-sm font-bold uppercase tracking-widest">Itinerary details are being mapped.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "inclusions" && (
                <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                  <div className="text-slate-600 leading-relaxed font-medium text-lg break-words prose prose-slate max-w-none">
                    {renderStrapiBlocks(tour.Inclusions) || "Comprehensive inclusions list coming soon."}
                  </div>
                </div>
              )}

              {activeTab === "bring" && (
                <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                  <div className="text-slate-600 leading-relaxed font-medium text-lg break-words prose prose-slate max-w-none">
                    {renderStrapiBlocks(tour.WhatToBring) || "Gear recommendations will be provided upon confirmation."}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10 text-slate-900">Visual <span className={brand.accent}>Narrative</span></h2>
          <div className="mb-20">
            {galleryImages.length > 0 ? (
              <TourGallery images={galleryImages} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="aspect-square rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-bold uppercase text-[9px] tracking-widest">
                    Media Pending
                  </div>
                ))}
              </div>
            )}
          </div>

          <section id="inquiry-form" className="p-8 md:p-16 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 ${brand.bgAccent} blur-[120px] opacity-20`} />
            {isSubmitted ? (
              <div className="text-center py-10 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">Expedition Requested</h2>
                <p className="text-slate-400 italic max-w-md mx-auto leading-relaxed mb-10 text-lg">
                  Our local experts have received your signal. We will respond within 24 hours to begin your journey.
                </p>
                <button onClick={() => setIsSubmitted(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all underline decoration-white/20">
                  Send another signal
                </button>
              </div>
            ) : (
              <>
                <div className="mb-14 relative z-10">
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none mb-4">Plan Your <span className={brand.accent}>Arrival</span></h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Our local team provides end-to-end logistics for your safety and comfort.</p>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {[
                    { label: "Your Name", type: "text", placeholder: "Full Name" },
                    { label: "Total Travelers", type: "number", placeholder: "1" },
                    { label: "Your Email", type: "email", placeholder: "email@example.com" },
                    { label: "Direct Phone", type: "tel", placeholder: "+251..." },
                    { label: "Arrival Date", type: "date" },
                    { label: "Departure Date", type: "date" },
                  ].map((field, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">{field.label}</label>
                      <input 
                        required 
                        type={field.type} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder:text-white/10 text-white" 
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Special Requirements or Interests</label>
                    <textarea required rows={5} className="bg-white/5 border border-white/10 rounded-2xl p-5 focus:ring-2 focus:ring-orange-500/50 outline-none resize-none transition-all text-white" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button 
                      disabled={isSubmitting} 
                      type="submit" 
                      className={`w-full ${brand.bgAccent} text-white font-black py-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-sm shadow-2xl disabled:bg-slate-700 disabled:scale-100`}
                    >
                      {isSubmitting ? "TRANSMITTING..." : "SEND EXPEDITION INQUIRY"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 sticky top-24">
            <div className="space-y-8">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{hasPricing ? "Base Investment" : "Tailored Pricing"}</p>
                <p className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
                  {hasPricing ? `$${startingPrice}` : "Price upon request"}
                </p>
                {hasPricing && <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 italic tracking-widest">per explorer / all-inclusive options</p>}
              </div>
              
              <div className="flex flex-col gap-4">
                {hasPricing && (
                  <button 
                    onClick={handleToggleCart} 
                    className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-[0.15em] text-[11px] text-center shadow-xl hover:shadow-orange-500/20 active:scale-95 ${isInCart ? "bg-slate-900 text-white" : `${brand.bgAccent} text-white`}`}
                  >
                    {isInCart ? "View Tour Cart" : "+ Reserve Expedition Slot"}
                  </button>
                )}
                
                <div className={hasPricing ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                  <a 
                    href="https://wa.me/251928714272" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-[#25D366] text-white font-black py-4 rounded-2xl text-center text-[10px] uppercase hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="#inquiry-form" 
                    className="bg-slate-100 text-slate-900 font-black py-4 rounded-2xl text-center text-[10px] uppercase hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    Inquire
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Expert Local Guide Included</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Safety & Logistics Managed</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}