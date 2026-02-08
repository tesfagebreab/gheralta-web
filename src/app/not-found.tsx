//"use client";
import Link from "next/link";
import { getBrand } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';

export default async function NotFound() {
  const brand = getBrand();
  const currentSite = await getSiteName();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen md:min-h-[70vh] px-6 text-center font-sans relative overflow-hidden">
      {/* 404 Background Text - Scaled for Mobile Browsers */}
      <h1 className="text-[8rem] md:text-[20rem] font-black text-slate-50 absolute -z-10 select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        404
      </h1>
      
      <div className="space-y-4 relative z-10">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">
          Expedition <span className={brand.accent}>Off-Track</span>
        </h2>
        <p className="text-slate-500 text-sm md:text-base max-w-xs md:max-w-md mx-auto font-medium leading-relaxed">
          It looks like the path you're looking for doesn't exist on <strong>{currentSite}</strong>. 
          Let's get you back to the base camp.
        </p>
      </div>

      <Link href="/" className="mt-8 relative z-10">
        <button className={`${brand.bgAccent} text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:scale-105 transition-all active:scale-95`}>
          Return Home
        </button>
      </Link>

      <div className="mt-12 md:mt-16 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 relative z-10">
        Lost in the mountains? Contact our guides.
      </div>
    </main>
  );
}