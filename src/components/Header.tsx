'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRANDS, CONTACT_INFO, BrandId } from '@/lib/constants/';

interface HeaderProps {
  currentBrand: BrandId;
}

export default function Header({ currentBrand }: HeaderProps) {
  const brand = BRANDS[currentBrand];
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-2">
          {/* Replace with actual Image component */}
          <span className={`text-2xl font-serif font-bold ${brand.colors.accent}`}>
            {brand.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/tours" className="text-sm font-medium text-stone-600 hover:text-stone-900">
            Tours
          </Link>
          <Link href="/about" className="text-sm font-medium text-stone-600 hover:text-stone-900">
            About
          </Link>
          <Link href="/blog" className="text-sm font-medium text-stone-600 hover:text-stone-900">
            Journal
          </Link>
        </nav>

        {/* Action Buttons (Constraint: Keep Styling) */}
        <div className="flex items-center gap-3">
          {/* WhatsApp / Chat with Us */}
          <a 
            href={`https://wa.me/${CONTACT_INFO.whatsapp}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-whatsapp px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105"
          >
             <span>Chat with us</span>
          </a>

          {/* Send Inquiry */}
          <Link 
            href="/contact" 
            className="btn-inquiry px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105"
          >
            Send Inquiry
          </Link>
        </div>
      </div>
    </header>
  );
}