import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectedToursFloat from "@/components/SelectedToursFloat";
import { getBrand, SITE_NAME, STRAPI_URL, getStrapiMedia } from "@/lib/constants";

// Force fresh data on every request for multi-tenant domain switching
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
 */
async function getBrandAssets() {
  try {
    // Use filtered list query instead of invalid single-item ID
    const res = await fetch(
      `${STRAPI_URL}/api/domains?filters[name][$containsi]=${SITE_NAME}&populate=*`,
      {
        next: { revalidate: 3600 }
      }
    );
    const json = await res.json();
    // Take the first matching domain (one-to-one relation expected)
    return json.data?.[0]?.attributes || null;
  } catch (error) {
    console.error("Layout: Failed to fetch brand assets", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const brandConfig = getBrand();
  const brandData = await getBrandAssets();
  
  // Navigate the Strapi v5 media object structure properly
  const faviconObj = brandData?.favicon?.data;
  const logoObj = brandData?.brand_logo?.data;
  
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