import Link from 'next/link';

import { getBrand } from "@/lib/domain-helper";

export default async function ContactSuccessPage() {
  const brand = await getBrand();
    const SITE_NAME = brand.domain;
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fafaf9] px-6">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[3rem] shadow-xl border border-stone-100 animate-fade-in">
        
        {/* Success Icon with Brand Accent */}
        <div className={`w-20 h-20 ${brand.colors.bgAccent} rounded-full flex items-center justify-center mx-auto text-white text-3xl shadow-lg`}>
          ✓
        </div>

        <div>
          <h1 className="text-4xl font-serif font-black italic uppercase text-stone-900 mb-4 tracking-tighter">
            Message Delivered!
          </h1>
          <p className="text-stone-600 leading-relaxed font-medium">
            Thank you for contacting us! You have successfully submitted your message. We will get back to you within **12 hours**. Check your inbox soon!
          </p>
        </div>

        {/* Action Button using Brand Styling */}
        <Link 
          href="/" 
          className={`block w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white ${brand.colors.bgAccent} hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]`}
        >
          Back to Basecamp
        </Link>

        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pt-4">
          Official {brand.name} Response Team
        </p>
      </div>
    </main>
  );
}