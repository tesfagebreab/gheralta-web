"use client";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";
import Link from "next/link";
import { getBrand } from "@/lib/domain-helper";

// Force Next.js to skip the cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SelectedToursFloat() {
  const [count, setCount] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch Brand configuration
    async function initBrand() {
      const brandData = await getBrand();
      setBrand(brandData);
    }
    initBrand();

    // 2. Setup Cart Logic
    const updateCart = () => {
      const cart = getCart();
      setCount(cart.length);
      setIds(cart);
      
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    };

    updateCart(); 

    window.addEventListener("cart-updated", updateCart);
    return () => window.removeEventListener("cart-updated", updateCart);
  }, []);

  // Don't show if cart is empty or brand isn't loaded yet
  if (count === 0 || !brand) return null;

  return (
    /* Adjusted bottom and max-width for mobile browser safety and to avoid overlapping the chat button */
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[280px] md:max-w-[320px] px-4 font-sans">
      <Link 
        href={`/checkout?tourId=${ids.join(",")}`}
        className={`
          flex items-center justify-between gap-4 
          ${brand.colors.bgAccent} text-white p-2 pl-6 md:pl-7 rounded-full 
          shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95 
          transition-all duration-300 group
          ${isAnimating ? "animate-bounce" : ""}
        `}
      >
        <div className="flex flex-col">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] leading-none">
            Review Trip
          </span>
          <span className="text-[8px] md:text-[9px] font-bold opacity-90 uppercase mt-1">
            {count} {count === 1 ? "Expedition" : "Expeditions"} Added
          </span>
        </div>

        <div className="bg-white/20 backdrop-blur-md h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <svg 
            className="w-4 h-4 md:w-5 md:h-5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="3" 
              d="M17 8l4 4m0 0l-4 4m4-4H3" 
            />
          </svg>
        </div>
      </Link>
    </div>
  );
}