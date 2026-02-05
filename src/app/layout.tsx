import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectedToursFloat from "@/components/SelectedToursFloat";

import { STRAPI_URL, getField, getStrapiMedia } from "@/lib/constants";
import { getBrand, getDynamicContact } from "@/lib/domain-helper";

// Force fresh data on every request for multi-tenant domain switching
export const dynamic = "force-dynamic";

// Viewport export: maximum-scale=1 and user-scalable=no prevents 
// "auto-zoom" on input fields in iOS, which can break layout.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c2410c", // Brand burnt clay color for mobile browser bars
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
 * Updated to use domain name filtering instead of docId
 */
async function getBrandAssets(domainName: string) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/domains?filters[name][$eq]=${domainName}&populate=*`, {
      next: { revalidate: 3600 }
    });
    const json = await res.json();
    // Return the first match from the data array
    return json.data?.[0];
  } catch (error) {
    console.error("Layout: Failed to fetch brand assets", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const brandConfig = await getBrand();
  const SITE_NAME = brandConfig.domain;
  const brandData = await getBrandAssets(SITE_NAME);
  
  // Navigate the Strapi v5 media object structure properly
  // Since we fetch via filters, the structure is usually direct or under attributes in Strapi 5
  const faviconObj = brandData?.favicon || brandData?.attributes?.favicon;
  const logoObj = brandData?.brand_logo || brandData?.attributes?.brand_logo;
  
  const faviconUrl = getStrapiMedia(faviconObj || logoObj, 'thumbnail') || "/icon.png";
  
  return {
    title: {
      template: `%s | ${brandConfig.name}`,
      default: `${brandConfig.name} | Gheralta Mountains Expedition`,
    },
    description: brandConfig.description || `Expert-led tours and adventures in the Gheralta Mountains, Tigray.`,
    metadataBase: new URL(`https://${SITE_NAME}`),
    // Mobile optimization: Explicitly defining sizes for different icon types
    icons: {
      icon: [
        { url: faviconUrl, type: 'image/png' },
        { url: faviconUrl, sizes: '32x32', type: 'image/png' },
      ],
      shortcut: faviconUrl,
      apple: [
        { url: faviconUrl, sizes: '180x180', type: 'image/png' }, // Standard size for iOS home screen
      ],
    },
    // Ensure the browser handles the app-like experience on mobile
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
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We fetch brand here to ensure it's available for child components if needed
  const brand = await getBrand();

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased font-sans bg-[#fafaf9] text-stone-900 flex flex-col min-h-screen overflow-x-hidden`}
      >
        {/* Navbar handles mobile menu internally */}
        <Navbar />
        
        {/* main ensures content doesn't horizontal scroll on small screens */}
        <main className="flex-grow w-full max-w-full overflow-x-hidden">
          {children}
        </main>

        {/* SelectedToursFloat is pinned to bottom; logic is brand-aware */}
        <SelectedToursFloat />

        <Footer />
      </body>
    </html>
  );
}