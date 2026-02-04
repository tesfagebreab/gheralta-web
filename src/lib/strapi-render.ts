import React from "react";

export const renderContent = (content: any) => {
  if (!content) return null;
  if (typeof content === 'string') return <p>{content}</p>;
  
  return content.map((block: any, idx: number) => {
    if (block.type === 'paragraph') {
      return (
        <p key={idx} className="mb-4">
          {block.children?.map((c: any, i: number) => (
            <span key={i} className={`${c.bold ? 'font-bold' : ''} ${c.italic ? 'italic' : ''}`}>
              {c.text}
            </span>
          ))}
        </p>
      );
    }
    if (block.type === 'list') {
      return (
        <ul key={idx} className="list-disc pl-6 mb-4">
          {block.children?.map((li: any, i: number) => (
            <li key={i}>{li.children?.[0]?.text}</li>
          ))}
        </ul>
      );
    }
    return null;
  });
};