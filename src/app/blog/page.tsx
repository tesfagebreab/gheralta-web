import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { STRAPI_URL, getDynamicBrand, SITE_NAME, getField, getStrapiMedia } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getDynamicBrand();
  return {
    title: `Our Thinking | ${brand.name}`,
    description: `Stories, guides, and insights from the heart of the Gheralta Mountains with ${brand.name}.`,
  };
}

export default async function BlogPage() {
  const brand = await getDynamicBrand();

  try {
    const res = await fetch(
      `${STRAPI_URL}/api/posts?populate=*&sort=createdAt:desc`,
      { cache: 'no-store' }
    );
    
    const json = await res.json();
    const allPosts = json.data || [];

    const posts = allPosts.filter((post: any) => {
      const domainRelation = post.domains || post.attributes?.domains;
      const domainList = Array.isArray(domainRelation) ? domainRelation : (domainRelation?.data || []);
      if (!domainList || domainList.length === 0) return false;

      return domainList.some((d: any) => {
        const dVal = d.domain || d.attributes?.domain || d.name || d.attributes?.name;
        return dVal?.toLowerCase().trim() === SITE_NAME.toLowerCase().trim();
      });
    });

    const featuredPost = posts[0];
    const remainingPosts = posts.slice(1);

    const getMainImage = (post: any) => {
      const images = getField(post, 'featured_image');
      if (!images) return null;
      return Array.isArray(images) ? images[0] : images;
    };

    return (
      <main className="bg-[#fafaf9] pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          
          <header className="mb-12 md:mb-20">
            <h1 className="text-6xl md:text-9xl font-black italic text-stone-900 leading-[0.9] md:leading-[0.8] uppercase tracking-tighter">
              The <span className={brand.accent}>Journal</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-stone-400 mt-6 md:mt-8 flex items-center gap-4">
              <span className={`w-8 md:w-12 h-[1px] ${brand.bgAccent}`} />
              Dispatches from Gheralta
            </p>
          </header>

          {posts.length > 0 ? (
            <>
              {/* Featured Post (Hero) */}
              {featuredPost && (
                <section className="mb-20 md:mb-32 group">
                  <Link href={`/blog/${getField(featuredPost, 'slug')}`} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-7 relative h-[400px] md:h-[650px] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl bg-stone-200">
                      <Image
                        src={getStrapiMedia(getMainImage(featuredPost)) || "/placeholder.jpg"}
                        alt={getField(featuredPost, 'title') || "Featured Post"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        unoptimized
                        priority
                      />
                    </div>
                    <div className="lg:col-span-5 px-1 md:px-0">
                      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                        {getField(featuredPost, 'categories')?.map((cat: any) => (
                          <span key={cat.id} className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white ${brand.bgAccent} px-3 md:px-4 py-1.5 rounded-full`}>
                            {getField(cat, 'Title') || getField(cat, 'name')}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-3xl md:text-6xl font-black italic text-stone-900 uppercase tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 md:mb-8 break-words">
                        {getField(featuredPost, 'title')}
                      </h2>
                      <p className="text-stone-600 text-lg md:text-xl mb-8 md:mb-10 line-clamp-3 leading-relaxed font-serif italic">
                        {getField(featuredPost, 'excerpt')}
                      </p>
                      <div className="inline-flex items-center gap-4 group/btn">
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-stone-900 pb-1">
                          Read Story
                        </span>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${brand.bgAccent} group-hover/btn:translate-x-2 transition-transform`}>
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Grid for Remaining Posts */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 md:gap-y-20">
                {remainingPosts.map((post: any) => (
                  <article key={post.id} className="group">
                    <Link href={`/blog/${getField(post, 'slug')}`}>
                      <div className="relative h-64 md:h-80 mb-6 md:mb-8 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-sm group-hover:shadow-xl transition-all duration-500 bg-stone-200">
                        <Image
                          src={getStrapiMedia(getMainImage(post)) || "/placeholder.jpg"}
                          alt={getField(post, 'title') || "Blog Post"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-1000"
                          unoptimized
                        />
                      </div>
                      <div className="px-2">
                        <div className="flex gap-4 mb-3 md:mb-4">
                           {getField(post, 'categories')?.slice(0, 1).map((cat: any) => (
                            <span key={cat.id} className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${brand.accent}`}>
                              {getField(cat, 'Title') || getField(cat, 'name')}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black italic text-stone-900 uppercase tracking-tighter leading-tight mb-3 md:mb-4 group-hover:text-stone-600 transition-colors">
                          {getField(post, 'title')}
                        </h3>
                        <p className="text-stone-500 text-sm line-clamp-2 mb-6 md:mb-8 leading-relaxed">
                          {getField(post, 'excerpt')}
                        </p>
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-900 flex items-center gap-2">
                          Read dispatch <span className={brand.accent}>+</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <div className="py-20 md:py-32 text-center border-2 border-dashed border-stone-200 rounded-[2rem] md:rounded-[4rem] bg-stone-50/50">
               <p className="text-stone-400 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] px-6">
                 No dispatches available for {SITE_NAME} yet.
               </p>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error("Blog Page Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] px-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Connection to basecamp lost...</p>
      </div>
    );
  }
}