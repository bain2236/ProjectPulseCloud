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
          h1: ({ node, ...props }) => <NeonHeading level={1} {...props} />,
          h2: ({ node, ...props }) => <NeonHeading level={2} {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-lg leading-relaxed text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
