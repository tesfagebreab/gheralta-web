// src/app/layout.tsx
// RAILPACK CACHE BUST - 2026-02-08 FINAL - STRAPI V5 COMPATIBLE

import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectedToursFloat from "@/components/SelectedToursFloat";
import { getBrand, STRAPI_URL, getStrapiMedia, getField } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';

// Force fresh data on every request for multi-tenant domain switching
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Viewport export: sets brand theme color dynamically based on the sandstone palette
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c2410c", // Burnt Clay / Sandstone primary
};

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/**
 * Helper to fetch brand-specific assets (Logo, Favicon) from Strapi v5
 */
export async function getBrandAssets() {
  const currentSite = await getSiteName();

  try {
    // Using $eqi for case-insensitive matching in Strapi v5
    const res = await fetch(`${STRAPI_URL}/api/domains?filters[name][$eqi]=${currentSite}&populate=*`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) throw new Error("Failed to fetch domain assets");
    const json = await res.json();
    
    // Strapi v5 Normalization: Return the first item
    return json.data?.[0] || null;
  } catch (error) {
    console.error("Layout: Failed to fetch brand assets", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const currentSite = await getSiteName();
  const brandConfig = getBrand(currentSite);
  const rawBrandData = await getBrandAssets();
  
  // Use getField helper for v5 resilience (handles .attributes or flat)
  const faviconObj = getField(rawBrandData, 'favicon');
  const logoObj = getField(rawBrandData, 'brand_logo');
  
  // Fallback chain for favicon: Strapi Favicon > Strapi Logo > Static Icon
  const faviconUrl = getStrapiMedia(faviconObj || logoObj, 'thumbnail') || "/icon.png";
  
  return {
    title: {
      template: `%s | ${brandConfig.name}`,
      default: `${brandConfig.name} | Gheralta Mountains Expedition`,
    },
    description: brandConfig.description || `Expert-led tours and adventures in the Gheralta Mountains, Tigray.`,
    metadataBase: new URL(`https://${currentSite}`),
    icons: {
      icon: [
        { url: faviconUrl, type: 'image/png' },
        { url: faviconUrl, sizes: '32x32', type: 'image/png' },
      ],
      shortcut: faviconUrl,
      apple: [
        { url: faviconUrl, sizes: '180x180', type: 'image/png' },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brandConfig.name,
    },
    openGraph: {
      title: brandConfig.name,
      description: brandConfig.description,
      siteName: brandConfig.name,
      locale: 'en_US',
      type: 'website',
      images: logoObj ? [getStrapiMedia(logoObj)] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Identify the domain and brand configuration
  const currentSite = await getSiteName();
  const brandConfig = getBrand(currentSite);
  
  // Create the CSS class selector (e.g., brand-tours, brand-abuneyemata) 
  // to toggle variables in globals.css
  const brandClassName = `brand-${brandConfig.id}`;

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} ${brandClassName} antialiased font-sans flex flex-col min-h-screen overflow-x-hidden`}
      >
        {/* Pass domain to components that need server-side brand context if needed */}
        <Navbar />
        
        <main className="flex-grow w-full max-w-full overflow-x-hidden">
          {children}
        </main>

        <SelectedToursFloat />

        <Footer />
      </body>
    </html>
  );
}