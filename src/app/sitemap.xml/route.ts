import { STRAPI_URL } from "@/lib/constants";

// Cache the sitemap for 24 hours (86400 seconds) to ease server load
export const revalidate = 86400; 

async function getBrandContent(domain: string, collection: "tours" | "posts") {
  // We filter by the 'domains' relation. 
  // Make sure your Content Types (Tour/Post) have a relation field named 'domains' or 'domain'
  const endpoint = `${STRAPI_URL}/api/${collection}?filters[domains][name][$contains]=${domain}&fields[0]=slug&fields[1]=updatedAt&pagination[limit]=1000`;
  
  try {
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(`Sitemap fetch error for ${collection}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  // 1. Identify the Domain
  const host = request.headers.get("host") || "gheraltatours.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  
  // Clean domain string for Strapi filtering (remove port/www)
  const domainKey = host.replace("www.", "").split(":")[0];

  // 2. Define Static Pages (Always exist for every brand)
  // You can add more here if needed
  const staticPages = [
    "",
    "/tours",
    "/about-us",
    "/blog",
    "/contact",
  ];

  // 3. Fetch Dynamic Content from Strapi
  const [tours, posts] = await Promise.all([
    getBrandContent(domainKey, "tours"),
    getBrandContent(domainKey, "posts")
  ]);

  // 4. Generate XML Entries
  const staticUrls = staticPages.map((page) => {
    return `
    <url>
      <loc>${baseUrl}${page}</loc>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
      <priority>${page === "" ? "1.0" : "0.8"}</priority>
    </url>`;
  });

  const tourUrls = tours.map((tour: any) => {
    return `
    <url>
      <loc>${baseUrl}/tours/${tour.attributes?.slug || tour.slug}</loc>
      <lastmod>${(tour.attributes?.updatedAt || tour.updatedAt || new Date().toISOString()).split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`;
  });

  const postUrls = posts.map((post: any) => {
    return `
    <url>
      <loc>${baseUrl}/blog/${post.attributes?.slug || post.slug}</loc>
      <lastmod>${(post.attributes?.updatedAt || post.updatedAt || new Date().toISOString()).split('T')[0]}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`;
  });

  // 5. Combine everything into valid XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticUrls.join("")}
    ${tourUrls.join("")}
    ${postUrls.join("")}
  </urlset>`;

  // 6. Return the Response
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}