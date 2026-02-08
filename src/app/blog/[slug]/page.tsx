import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from 'react';
import { notFound } from "next/navigation";
import { 
  STRAPI_URL, 
  getBrand, 
  getField, 
  getStrapiMedia 
} from "@/lib/constants";

import { getSiteName } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

// --- IMPROVED MANUAL BLOCK RENDERER ---
const RenderBlocks = ({ content, accentColor }: { content: any[], accentColor: string }) => {
  if (!content || !Array.isArray(content)) return null;

  return content.map((block: any, index: number) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p key={index} className="mb-8 text-stone-700 leading-relaxed font-sans text-lg md:text-xl">
            {block.children?.map((child: any, i: number) => (
              <span key={i} className={child.bold ? "font-bold text-stone-900" : ""}>
                {child.text}
              </span>
            ))}
          </p>
        );

      case "heading":
        const Tag = `h${block.level || 2}` as keyof React.JSX.IntrinsicElements;
        const sizeClass = block.level === 1 ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl";
        return (
          <Tag key={index} className={`font-black uppercase italic tracking-tighter mt-12 mb-6 ${accentColor} ${sizeClass} leading-tight`}>
            {block.children?.map((child: any) => child.text).join("")}
          </Tag>
        );

      case "list":
        const ListTag = block.format === "ordered" ? "ol" : "ul";
        return (
          <ListTag key={index} className="mb-8 ml-6 list-disc space-y-4 text-stone-700 text-lg">
            {block.children?.map((item: any, i: number) => (
              <li key={i} className="pl-2">
                {item.children?.map((c: any) => c.text).join("")}
              </li>
            ))}
          </ListTag>
        );

      case "image":
        const imgUrl = block.image?.url || block.attributes?.url;
        if (!imgUrl) return null;
        return (
          <div key={index} className="my-12 relative h-[350px] md:h-[600px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-stone-200">
            <Image
              src={imgUrl}
              alt={block.image?.alternativeText || "Article visual"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        );

      default:
        return null;
    }
  });
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const currentSite = getSiteName(); // safe in server component

  try {
    const res = await fetch(`${STRAPI_URL}/api/posts?filters[slug][$eq]=${slug}&populate=*`);
    const json = await res.json();
    const post = json.data?.[0];
    const title = post?.title || post?.attributes?.title || slug;
    return { 
      title: `${title} | Journal | ${currentSite}`,
      description: post?.excerpt || post?.attributes?.excerpt
    };
  } catch {
    return { title: `Journal | ${currentSite}` };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const brand = getBrand();
  const currentSite = getSiteName(); // safe in server component

  const fetchUrl = `${STRAPI_URL}/api/posts?filters[slug][$eq]=${slug}&populate=*`;
  const res = await fetch(fetchUrl, { cache: 'no-store' });
  const json = await res.json();
  const post = json.data?.[0];

  if (!post) notFound();

  const title = post.title || post.attributes?.title || "Untitled Post";
  const content = post.content || post.attributes?.content;
  const excerpt = post.excerpt || post.attributes?.excerpt;
  const rawImage = post.featured_image || post.attributes?.featured_image;
  const heroImg = Array.isArray(rawImage) ? rawImage[0] : rawImage;

  return (
    <main className="bg-[#fafaf9] min-h-screen pb-24 font-sans overflow-x-hidden">
      {/* HEADER SECTION */}
      <header className="pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-stone-900 transition-all mb-8 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform underline decoration-stone-200 underline-offset-4">← Return to Dispatch</span>
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-black italic text-stone-900 uppercase tracking-tighter leading-tight mb-8">
            {title.split(' ').map((word: string, i: number) => (
              <span key={i} className={i % 3 === 1 ? brand.accent : ""}>
                {word}{' '}
              </span>
            ))}
          </h1>

          {excerpt && (
            <p className="text-xl md:text-2xl text-stone-500 font-serif italic max-w-3xl leading-relaxed">
              {excerpt}
            </p>
          )}
        </div>
      </header>

      {/* HERO IMAGE */}
      {heroImg && (
        <section className="px-6 mb-16">
          <div className="max-w-7xl mx-auto relative h-[50vh] md:h-[70vh] w-full overflow-hidden rounded-[3rem] shadow-2xl bg-stone-200">
            <Image
              src={getStrapiMedia(heroImg) || "/placeholder.jpg"}
              alt={title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[3rem]" />
          </div>
        </section>
      )}

      {/* CONTENT AREA */}
      <div className="max-w-4xl mx-auto px-6">
        <article className="relative">
          <div className="prose prose-stone max-w-none">
            {content ? (
              <RenderBlocks content={content} accentColor={brand.accent} />
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-stone-200 rounded-[3rem]">
                <p className="italic text-stone-400 font-serif">The transcription for this dispatch is currently unavailable.</p>
              </div>
            )}
          </div>
        </article>

        {/* FOOTER NAVIGATION */}
        <footer className="mt-24 pt-16 border-t border-stone-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-3">You are reading</p>
              <p className="font-serif italic text-3xl text-stone-900">The Gheralta Journal</p>
            </div>
            
            <Link 
                href="/contact"
                className={`${brand.bgAccent} text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-105 hover:brightness-110 active:scale-95`}
            >
              Book This Experience
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}