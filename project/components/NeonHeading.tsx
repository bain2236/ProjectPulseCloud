'use client';

import React from 'react';

interface NeonHeadingProps {
  level: 1 | 2;
  children: React.ReactNode;
}

const NeonHeading: React.FC<NeonHeadingProps> = ({ level, children }) => {
  const colors = level === 1 
    ? ['#00ffff', '#ff00ff'] // H1: Cyan and Magenta
    : ['#ff00ff', '#00ffff']; // H2: Magenta and Cyan
  
  const dimGlowStyle: React.CSSProperties = {
    fontFamily: "'Orbitron', sans-serif",
    color: '#ddd',
    textShadow: `0 0 4px ${colors[0]}, 0 0 8px ${colors[1]}`,
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <div className="mb-8">
      <Tag
        className="font-bold tracking-wider"
        style={dimGlowStyle}
      >
        {children}
      </Tag>
    </div>
  );
};

export default NeonHeading;
