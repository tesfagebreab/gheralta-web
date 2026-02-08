"use client";
import Link from "next/link";
import { useEffect } from "react";
import { getBrand } from "@/lib/constants";
import { clearCart } from "@/lib/cart";

export default function SuccessPage() {
  const brand = getBrand();

  useEffect(() => {
    // Ensure the trip is cleared so the floating cart/trip button disappears
    clearCart();
    
    // Optional: Scroll to top on success
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
        
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 bg-green-50">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">
          Adventure <span className={brand.accent}>Confirmed</span>
        </h1>
        
        <p className="text-slate-600 font-medium leading-relaxed mb-8">
          Your payment was successful! We are already preparing for your arrival in <span className="text-slate-900 font-bold">{brand.name}</span>. Check your email for your itinerary and receipt.
        </p>

        {/* Next Steps Card */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-4">
          <div className="flex gap-4">
            <div className={`w-6 h-6 rounded-full ${brand.bgAccent} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>1</div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Guide assignment within 12 hours</p>
          </div>
          <div className="flex gap-4">
            <div className={`w-6 h-6 rounded-full ${brand.bgAccent} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>2</div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Arrival logistics sent via WhatsApp/Email</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className={`w-full ${brand.bgAccent} text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-xl shadow-slate-100`}
          >
            Back to Home
          </Link>
          <a 
            href="https://wa.me/251928714272" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest"
          >
            Questions? Chat with our team
          </a>
        </div>

        {/* Decorative branding element */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${brand.bgAccent} opacity-5 -mr-16 -mt-16 rounded-full`} />
      </div>
    </main>
  );
}