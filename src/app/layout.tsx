// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectedToursFloat from "@/components/SelectedToursFloat";
import { getBrand, STRAPI_URL, getStrapiMedia, getField } from "@/lib/constants";
import { getSiteName } from '@/lib/server-utils';

// ISR Strategy: Revalidate once per hour to balance speed and freshness
export const revalidate = 3600;

/**
 * Dynamic Viewport: Adjusts the browser chrome/mobile status bar color
 */
export async function generateViewport(): Promise<Viewport> {
  const currentSite = await getSiteName();
  const brandConfig = getBrand(currentSite);
  
  // Mapping theme colors to the brand's primary identity
  const themeColors = {
    tours: "#c2410c",       // Burnt Clay
    adventures: "#15803d",  // Trek Green
    abuneyemata: "#b45309"  // Updated to match globals.css Deep Ochre
  };

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: themeColors[brandConfig.id as keyof typeof themeColors] || "#c2410c",
  };
}

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
 * Helper to fetch brand-specific assets from Strapi v5
 */
export async function getBrandAssets() {
  const currentSite = await getSiteName();

  try {
    const res = await fetch(`${STRAPI_URL}/api/domains?filters[name][$eqi]=${currentSite}&populate=*`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) throw new Error("Failed to fetch domain assets");
    const json = await res.json();
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
  
  const faviconObj = getField(rawBrandData, 'favicon');
  const logoObj = getField(rawBrandData, 'brand_logo');
  const faviconUrl = getStrapiMedia(faviconObj || logoObj, 'thumbnail') || "/icon.png";
  
  return {
    title: {
      template: `%s | ${brandConfig.name}`,
      default: `${brandConfig.name} | Gheralta Mountains Expedition`,
    },
    description: brandConfig.description,
    metadataBase: new URL(`https://${currentSite}`),
    icons: {
      icon: [{ url: faviconUrl, type: 'image/png' }],
      shortcut: faviconUrl,
      apple: [{ url: faviconUrl, sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title: brandConfig.name,
      description: brandConfig.description,
      siteName: brandConfig.name,
      images: logoObj ? [getStrapiMedia(logoObj)] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentSite = await getSiteName();
  const brandConfig = getBrand(currentSite);
  
  // Data-attribute for CSS Variable targeting
  // Class name for manual legacy overrides
  const brandId = brandConfig.id;
  const brandClassName = `brand-${brandId}`;

  // Fix for the red underline: cast to any safely for the contact field
  const whatsappNumber = (brandConfig as any).contact?.whatsapp || '';

  return (
    <html lang="en" className="scroll-smooth" data-brand={brandId}>
      <body
        className={`
          ${sans.variable} 
          ${serif.variable} 
          ${mono.variable} 
          ${brandClassName} 
          antialiased 
          font-sans 
          flex 
          flex-col 
          min-h-screen 
          overflow-x-hidden
        `}
      >
        {/* Components automatically pick up brand colors from CSS variables */}
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