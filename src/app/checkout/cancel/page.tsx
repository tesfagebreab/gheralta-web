import Link from "next/link";
import { getBrand } from "@/lib/domain-helper";

// These MUST be in a Server Component, never with "use client"
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const brand = await getBrand();
  return { title: `Booking Cancelled | ${brand.domain}` };
}

export default async function CancelPage() {
  const brand = await getBrand();

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-2 border-slate-200">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
          Booking <span className="text-slate-400">Cancelled</span>
        </h1>

        <div className="flex flex-col gap-3">
          <Link href="/tours">
            <button className={`${brand.bgAccent} w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer`}>
              Back to Tours
            </button>
          </Link>
          <Link href="/checkout" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            ← Try Checkout Again
          </Link>
        </div>
      </div>
    </main>
  );
}