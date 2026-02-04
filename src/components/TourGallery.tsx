// components/TourGallery.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface GalleryProps {
  images: Array<{
    url: string;
    alternativeText?: string;
  }>;
}

export default function TourGallery({ images }: GalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0]?.url);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 1. MAIN LARGE VIEW - Adjusted aspect for mobile height efficiency */}
      <div className="relative aspect-[4/3] md:aspect-video w-full overflow-hidden rounded-xl border-2 md:border-4 border-stone-200 shadow-lg bg-stone-100">
        <Image
          src={activeImage}
          alt="Featured View"
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 80vw"
          priority 
        />
      </div>

      {/* 2. THUMBNAIL STRIP - Optimized for touch scrolling */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(img.url)}
            className={`relative h-16 w-20 md:h-20 md:w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all snap-start
              ${activeImage === img.url 
                ? 'border-[#c2410c] scale-105 z-10' 
                : 'border-stone-200 opacity-80 md:opacity-70'}`}
          >
            <Image
              src={img.url}
              alt={img.alternativeText || `Gallery image ${idx}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 100px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}