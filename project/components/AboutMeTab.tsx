'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import NeonHeading from './NeonHeading';

interface AboutMeTabProps {
  content: string;
}

export default function AboutMeTab({ content }: AboutMeTabProps) {
  return (
    <div className="p-8 text-white max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <NeonHeading level={1} delay={0} {...props} />,
          h2: ({ node, ...props }) => {
            // This is a bit of a hack to apply sequential delays.
            // A more robust solution might involve a custom Markdown processor.
            const h2s = Array.from(node.position?.start.line ? node.parent?.children || [] : []).filter(n => n.type === 'element' && n.tagName === 'h2');
            const index = h2s.indexOf(node as any);
            return <NeonHeading level={2} delay={0.5 + index * 0.5} {...props} />;
          },
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-lg leading-relaxed text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
