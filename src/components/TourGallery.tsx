'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface GalleryProps {
  images: Array<{
    url: string;
    alternativeText?: string;
  }>;
}

export default function TourGallery({ images }: GalleryProps) {
  // Initialize state with the first image
  const [activeImage, setActiveImage] = useState(images[0]?.url);

  // Optimization: Update active image if the images prop changes (navigating between tours)
  useEffect(() => {
    if (images.length > 0) {
      setActiveImage(images[0].url);
    }
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 1. MAIN LARGE VIEW */}
      <div className="relative aspect-[4/3] md:aspect-video w-full overflow-hidden rounded-2xl border-2 md:border-4 border-stone-200 shadow-xl bg-stone-100">
        <Image
          src={activeImage}
          alt="Featured Expedition View"
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 80vw"
          priority // Keeps LCP fast
          unoptimized={activeImage.startsWith('http')} // Use R2 directly if applicable
        />
      </div>

      {/* 2. THUMBNAIL STRIP - Brand Aware */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide">
        {images.map((img, idx) => {
          const isActive = activeImage === img.url;
          
          return (
            <button
              key={idx}
              onClick={() => setActiveImage(img.url)}
              className={`relative h-16 w-20 md:h-20 md:w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 snap-start
                ${isActive 
                  ? 'border-brand-accent scale-105 z-10 shadow-md' 
                  : 'border-stone-200 opacity-60 hover:opacity-100'}`}
            >
              <Image
                src={img.url}
                alt={img.alternativeText || `Gallery image ${idx}`}
                fill
                className="object-cover"
                sizes="100px"
                loading="lazy" // Optimize performance for long galleries
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}