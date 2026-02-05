"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { notFound, useParams, useRouter } from "next/navigation";

import { STRAPI_URL, getField, getStrapiMedia } from "@/lib/constants";
import { getBrand } from "@/lib/domain-helper";

import { addToCart, getCart } from "@/lib/cart";
import { Clock, Mountain, Map, MapPin, CheckCircle, Briefcase, Calendar } from "lucide-react";
import React from 'react';
import TourGallery from "@/components/TourGallery"; 

export const dynamic = 'force-dynamic';

// --- HELPERS ---

/**
 * Advanced Block Parser for Strapi v5
 * Handles Bold, Italic, Underline, Text Alignment, and Hyperlinks
 */
const renderStrapiBlocks = (content: any) => {
  if (!content) return null;
  
  const blocks = content.document || content.json || (Array.isArray(content) ? content : null);
  if (!Array.isArray(blocks)) return null;

  return blocks.map((block: any, index: number) => {
    // Determine horizontal alignment
    const alignmentClass = block.textAlign === 'center' ? 'text-center' : 
                           block.textAlign === 'right' ? 'text-right' : 'text-left';

    // Helper to render leaf nodes (text pieces and nested links)
    const renderLeaf = (child: any, i: number): React.ReactNode => {
      let classes = "";
      if (child.bold) classes += " font-black";
      if (child.italic) classes += " italic";
      if (child.underline) classes += " underline decoration-orange-500/30";
      if (child.strikethrough) classes += " line-through";
      if (child.code) classes += " font-mono bg-slate-100 px-1 rounded";

      // Handle Hyperlinks nested in blocks
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

    // Handle different block types
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
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isInCart, setIsInCart] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");

  useEffect(() => {
    async function fetchTour() {
      if (!slug) return;
      try {
        // Fetch Brand First
        const brandData = await getBrand();
        setBrand(brandData);

        const query = `${STRAPI_URL}/api/tours?filters[slug][$eq]=${slug}&populate[DailyPlan][populate]=*&populate[pricing_tiers][populate]=*&populate[Gallery][populate]=*&populate[destinations][populate]=*&populate[types][populate]=*&populate[tags][populate]=*`;
        const response = await fetch(query, { cache: "no-store" });
        const json = await response.json();
        const rawEntry = json.data?.[0];

        if (!rawEntry) {
          setLoading(false);
          return;
        }

        const attr = rawEntry.attributes || rawEntry;

        setTour({
          ...attr,
          documentId: rawEntry.documentId || attr.documentId,
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

        setIsInCart(getCart().includes(rawEntry.documentId || ""));
      } catch (err) {
        console.error("Fetch error:", err);
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
    
    const payload = {
      type: "INQUIRY",
      siteName: brand?.name || "Gheralta Tourism",
      data: {
        tourTitle: tour?.Title || "General Inquiry",
        fullName: (form[0] as HTMLInputElement).value || "",
        travelers: (form[1] as HTMLInputElement).value || "1",
        email: (form[2] as HTMLInputElement).value || "",
        phone: (form[3] as HTMLInputElement).value || "",
        arrivalDate: (form[4] as HTMLInputElement).value || "",
        departureDate: (form[5] as HTMLInputElement).value || "",
        message: (form[6] as HTMLTextAreaElement).value || "",
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

  if (loading || !brand) return <div className="h-screen flex items-center justify-center font-bold text-xs text-slate-400 uppercase tracking-widest">Loading Adventure...</div>;
  if (!tour) return notFound();

  const tiers = tour.Pricing_Tiers || {};
  const priceArray = [tiers?.tier_1, tiers?.tier_2_3, tiers?.tier_4_10, tiers?.tier_11_plus, tour?.Price_Starting_At].filter(p => typeof p === 'number' && p > 0);
  const startingPrice = priceArray.length > 0 ? Math.min(...priceArray) : null;
  const hasPricing = startingPrice !== null;
  const itinerary = Array.isArray(tour.DailyPlan) ? tour.DailyPlan : [];
  const gallery = Array.isArray(tour.Gallery) ? tour.Gallery : [];
  
  const galleryImages = gallery.map((img: any) => ({
    url: getStrapiMedia(img) || "",
    alternativeText: img.alternativeText || img.caption || tour.Title || "Gallery Image"
  })).filter((img: any) => img.url !== "");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="p-6 border-b border-slate-100 flex justify-between items-center">
        <Link href="/tours" className={`${brand.colors.accent} font-bold hover:underline transition-all uppercase text-[10px] tracking-widest`}>
          ← Back to Tours
        </Link>
        <span className="font-black italic tracking-tighter uppercase">{(brand.name || "Tour").split(' ')[0]}.</span>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[65vh] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        {tour.Image && (
          <Image src={getStrapiMedia(tour.Image) || ""} alt={tour.Title || "Hero"} fill className="object-cover opacity-70" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {(Array.isArray(tour.Tags) ? tour.Tags : []).map((tag: any, i: number) => (
              <span key={i} className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {safeText(tag).trim()}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white italic uppercase tracking-tighter max-w-5xl leading-[0.9] break-words drop-shadow-2xl">
            {tour.Title}
          </h1>
          <p className="text-white/80 mt-6 font-bold uppercase tracking-[0.4em] text-xs">
            {safeText(tour.Destinations) || "EXPLORE"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { label: "Duration", value: safeText(tour.Duration), icon: <Clock size={20} /> },
              { label: "Difficulty", value: safeText(tour.Difficulty), icon: <Mountain size={20} /> },
              { label: "Tour Type", value: safeText(tour.Types, true), icon: <Map size={20} /> },
              { label: "Destinations", value: safeText(tour.Destinations, true), icon: <MapPin size={20} /> }
            ].map((fact, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <span className={`${brand.colors.accent} mb-2 block`}>{fact.icon}</span>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{fact.label}</p>
                <div className="font-bold text-slate-900 text-sm whitespace-pre-line">{fact.value || "Request Info"}</div>
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-black italic uppercase tracking-tight mb-6">Adventure Overview</h2>
          <div className={`text-xl text-slate-600 leading-relaxed border-l-4 ${brand.colors.accent.replace('text-', 'border-')}/20 pl-6 mb-16`}>
            {renderStrapiBlocks(tour.Description) || "Description details are coming soon."}
          </div>

          <div className="mb-12">
            <div className="flex gap-8 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
              {[
                { id: "itinerary", label: "Itinerary", icon: <Calendar size={14} /> },
                { id: "inclusions", label: "What is Included", icon: <CheckCircle size={14} /> },
                { id: "bring", label: "What to Bring", icon: <Briefcase size={14} /> }
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? `${brand.colors.accent} border-b-2 ${brand.colors.accent.replace('text-', 'border-')}` : "text-slate-400"}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            
            <div className="min-h-[400px]">
              {activeTab === "itinerary" && (
                <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-12">
                  {itinerary.length > 0 ? itinerary.map((day: any, index: number) => (
                    <div key={index} className="relative pl-12 group">
                      <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-md transition-transform group-hover:scale-125 ${brand.colors.bgAccent}`} />
                      <div className="flex flex-col">
                        <h3 className="font-black italic uppercase text-2xl text-slate-900 mb-3 tracking-tighter leading-tight break-words">
                          {day.DayTitle || `Day ${index + 1}`}
                        </h3>
                        <div className="text-slate-600 leading-relaxed text-lg max-w-2xl break-words">
                          {renderStrapiBlocks(day.Activities) || "Activities for this day are being finalized."}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="pl-12 text-slate-400 italic">Detailed itinerary coming soon.</p>
                  )}
                </div>
              )}

              {activeTab === "inclusions" && (
                <div className="bg-slate-50 p-10 rounded-[3rem]">
                  <div className="text-slate-600 leading-relaxed font-medium text-lg break-words">
                    {renderStrapiBlocks(tour.Inclusions) || "Inclusions list is currently being updated."}
                  </div>
                </div>
              )}

              {activeTab === "bring" && (
                <div className="bg-slate-50 p-10 rounded-[3rem]">
                  <div className="text-slate-600 leading-relaxed text-lg break-words">
                    {renderStrapiBlocks(tour.WhatToBring) || "Gear requirements will be provided upon booking."}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-3xl font-black italic uppercase tracking-tight mb-8">Visual Journey</h2>
          <div className="mb-16">
            {galleryImages.length > 0 ? (
              <TourGallery images={galleryImages} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                    Coming Soon
                  </div>
                ))}
              </div>
            )}
          </div>

          <section id="inquiry-form" className="p-12 bg-slate-50 rounded-[3rem] border border-slate-200 min-h-[400px] flex flex-col justify-center">
            {isSubmitted ? (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4">Inquiry Received</h2>
                <p className="text-slate-600 italic max-w-md mx-auto leading-relaxed mb-8">
                  Thank you for reaching out! Expect a response within <span className={`text-slate-900 font-bold not-italic underline ${brand.colors.accent.replace('text-', 'decoration-')} ml-1`}>24 hours</span>.
                </p>
                <button onClick={() => setIsSubmitted(false)} className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ${brand.colors.accent.replace('text-', 'hover:text-')} transition-all`}>
                  ← Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-12 text-center">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">SEND US AN INQUIRY</h2>
                  <p className="text-slate-500 italic mt-2 text-sm">Our local team will help plan your perfect visit</p>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Your Name", type: "text", placeholder: "Full Name" },
                    { label: "Number of Travelers", type: "number", placeholder: "1" },
                    { label: "Your Email", type: "email", placeholder: "email@example.com" },
                    { label: "Phone Number", type: "tel", placeholder: "+251..." },
                    { label: "Arrival Date", type: "date" },
                    { label: "Departure Date", type: "date" },
                  ].map((field, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{field.label}</label>
                      <input required type={field.type} className={`bg-white border border-slate-200 rounded-2xl p-4 focus:ring-2 ${brand.colors.accent.replace('text-', 'focus:ring-')} outline-none`} />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tell us More</label>
                    <textarea required rows={5} className={`bg-white border border-slate-200 rounded-2xl p-4 focus:ring-2 ${brand.colors.accent.replace('text-', 'focus:ring-')} outline-none resize-none`} />
                  </div>
                  <div className="md:col-span-2">
                    <button disabled={isSubmitting} type="submit" className={`w-full ${brand.colors.bgAccent} text-white font-black py-5 rounded-2xl ${brand.colors.buttonHover} transition-all uppercase tracking-[0.2em] text-sm shadow-xl disabled:bg-slate-400`}>
                      {isSubmitting ? "SENDING..." : "SEND INQUIRY"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 sticky top-10">
            <div className="space-y-6">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{hasPricing ? "Starting From" : "Bespoke Adventure"}</p>
                <div className="text-4xl font-black italic tracking-tighter text-slate-900">
                  {hasPricing ? (
                    <>
                      ${startingPrice}
                      <span className="text-xs font-bold text-slate-400 uppercase ml-2 italic">/ person</span>
                    </>
                  ) : (
                    <span className="text-2xl">price upon request</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {hasPricing && (
                  <button onClick={handleToggleCart} className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs text-center shadow-lg ${isInCart ? "bg-slate-900 text-white" : `${brand.colors.bgAccent} text-white ${brand.colors.buttonHover}`}`}>
                    {isInCart ? "Go to Check Out!" : "+ Add to Tour Cart"}
                  </button>
                )}
                <div className={hasPricing ? "grid grid-cols-2 gap-3 mt-4" : "flex flex-col gap-3"}>
                  <a href="https://wa.me/251928714272" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-black py-4 rounded-full text-center text-[9px] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    Chat with us!
                  </a>
                  <a href="#inquiry-form" className="bg-slate-100 text-slate-900 font-black py-4 rounded-2xl text-center text-[9px] uppercase hover:bg-slate-200 transition-colors flex items-center justify-center">
                    Send Inquiry
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase leading-relaxed text-center italic">
              *All experiences are led by certified local guides.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}