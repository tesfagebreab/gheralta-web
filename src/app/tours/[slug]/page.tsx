import { Metadata } from "next";
import TourDetail from "./TourClient";
import { STRAPI_URL, SITE_NAME, getStrapiMedia } from "@/lib/constants";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // We use $eqi (case-insensitive) to be as flexible as possible
    const queryParams = [
      `filters[slug][$eqi]=${encodeURIComponent(slug)}`,
      `populate[Gallery][populate]=*`, 
      `populate[seo][populate]=*`
    ];
    
    const query = `${STRAPI_URL}/api/tours?${queryParams.join('&')}`;
    
    // FETCH DATA
    const response = await fetch(query, { cache: 'no-store' });
    const json = await response.json();
    const rawEntry = json.data?.[0];

    // --- DEBUGGING LOG (Check your blue PowerShell terminal) ---
    console.log(`--- METADATA DEBUG FOR: ${slug} ---`);
    console.log("Strapi URL:", query);
    console.log("Found Entry?:", !!rawEntry);
    if (rawEntry) {
        console.log("Title in Strapi:", rawEntry.attributes?.Title || rawEntry.Title);
    }
    // -----------------------------------------------------------

    if (rawEntry) {
      const attr = rawEntry.attributes || rawEntry;
      
      // Sync with TourClient logic
      const tourTitle = attr.Title || attr.title || "Adventure Tour";
      const seo = attr.seo;
      
      const metaTitle = seo?.metaTitle || seo?.meta_image || `${tourTitle} | ${SITE_NAME}`;
      const metaDesc = seo?.metaDescription || seo?.meta_description || `Join us for the ${tourTitle} in the Gheralta mountains.`;

      const seoImage = seo?.metaImage || seo?.meta_image;
      const gallery = attr.Gallery || [];
      const firstGalleryImage = gallery.length > 0 ? gallery[0] : null;
      const ogImageUrl = getStrapiMedia(seoImage || firstGalleryImage);

      return {
        title: metaTitle,
        description: metaDesc,
        openGraph: {
          title: metaTitle,
          description: metaDesc,
          images: ogImageUrl ? [{ url: ogImageUrl }] : [],
          type: 'website',
        },
        twitter: {
          card: "summary_large_image",
          title: metaTitle,
          description: metaDesc,
          images: ogImageUrl ? [ogImageUrl] : [],
        }
      };
    }

    // This triggers if Strapi returns an empty array []
    return { 
      title: `${slug.replace(/-/g, ' ')} | ${SITE_NAME}`, 
    };

  } catch (e) {
    console.error("Metadata generation error:", e);
    return { title: SITE_NAME };
  }
}

export default function Page() {
  return <TourDetail />;
}