import React from "react";

/**
 * Advanced Block Parser for Strapi v5
 * Standardized for use across all collection types
 */
export const renderContent = (content: any) => {
  if (!content) return null;
  
  // Handle legacy string content
  if (typeof content === 'string') return <p className="mb-4 leading-relaxed">{content}</p>;

  const blocks = content.document || content.json || (Array.isArray(content) ? content : null);
  if (!Array.isArray(blocks)) return null;

  return blocks.map((block: any, index: number) => {
    const alignmentClass = block.textAlign === 'center' ? 'text-center' : 
                           block.textAlign === 'right' ? 'text-right' : 'text-left';

    const renderLeaf = (child: any, i: number): React.ReactNode => {
      let classes = "";
      if (child.bold) classes += " font-black text-slate-900";
      if (child.italic) classes += " italic";
      if (child.underline) classes += " underline decoration-orange-500/30";
      if (child.strikethrough) classes += " line-through";
      if (child.code) classes += " font-mono bg-slate-100 px-1 rounded";

      if (child.type === 'link') {
        return (
          <a 
            key={i} 
            href={child.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-600 underline hover:text-orange-800 transition-colors inline-flex items-center gap-1"
          >
            {child.children?.map((c: any, j: number) => renderLeaf(c, j))}
          </a>
        );
      }

      return (
        <span key={i} className={classes}>
          {child.text}
        </span>
      );
    };

    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className={`${alignmentClass} mb-4 leading-relaxed break-words text-slate-600`}>
            {block.children?.map((child: any, i: number) => renderLeaf(child, i))}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${block.level || 3}` as keyof React.JSX.IntrinsicElements;
        const headingSizes: Record<number, string> = {
          1: "text-3xl md:text-5xl font-black uppercase mb-6 italic tracking-tighter leading-[0.9]",
          2: "text-2xl md:text-4xl font-black uppercase mb-5 italic tracking-tight leading-tight",
          3: "text-xl md:text-3xl font-black uppercase mb-4 italic leading-tight",
          4: "text-lg md:text-xl font-bold mb-3 leading-snug",
        };
        return (
          <HeadingTag key={index} className={`${alignmentClass} ${headingSizes[block.level || 3]} text-slate-900`}>
            {block.children?.map((child: any, i: number) => renderLeaf(child, i))}
          </HeadingTag>
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClass = block.format === 'ordered' ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={index} className={`${listClass} ml-6 mb-6 space-y-2 ${alignmentClass} text-slate-600`}>
            {block.children?.map((listItem: any, i: number) => (
              <li key={i} className="pl-2">
                {listItem.children?.map((child: any, j: number) => 
                   child.children 
                   ? child.children.map((c: any, k: number) => renderLeaf(c, k))
                   : renderLeaf(child, j)
                )}
              </li>
            ))}
          </ListTag>
        );

      default:
        return null;
    }
  });
};