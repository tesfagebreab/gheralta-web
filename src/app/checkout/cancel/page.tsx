"use client";

import Link from "next/link";
import { useEffect, use } from "react";
import { getBrand } from "@/lib/domain-helper";

export default function CancelPage() {
  // Use the 'use' hook to unwrap the brand data and resolve the red underline
  const brand = use(getBrand());
  const SITE_NAME = brand.domain;

  useEffect(() => {
    document.title = `Booking Cancelled | ${SITE_NAME}`;
  }, [SITE_NAME]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Cancel/Warning Icon */}
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-2 border-slate-200">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Booking <span className="text-slate-400">Cancelled</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your transaction was not completed and no payment was processed. If you experienced a technical issue, our team is available to help you complete your booking manually.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Need Assistance?</h2>
          <div className="space-y-4">
            <a 
              href="https://wa.me/251928714272" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-green-600 transition-colors"
            >
              <span className={brand.accent}>→</span> Chat with a local expert on WhatsApp
            </a>
            <Link 
              href="/#inquiry-form" 
              className="flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors"
            >
              <span className={brand.accent}>→</span> Send us a manual inquiry
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/tours" className="block">
            <button className={`${brand.bgAccent} w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition-all cursor-pointer`}>
              Back to Tours
            </button>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            ← Try Checkout Again
          </button>
        </div>
        
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Secure Multi-Brand Architecture by {SITE_NAME}
        </p>
      </div>
    </main>
  );
}