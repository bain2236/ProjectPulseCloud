'use client';

import { motion } from 'framer-motion';
import { LucideProps } from 'lucide-react';
import React from 'react';

interface IconButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

export default function IconButton({ href, label, icon: Icon }: IconButtonProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center justify-center w-32 h-10 px-4 text-sm font-bold text-cyan-300 bg-black border-2 border-cyan-400 rounded-lg overflow-hidden"
      whileHover="hover"
    >
      <span className="relative z-10 flex items-center">
        <Icon className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
        {label}
      </span>
      <motion.div
        className="absolute inset-0 bg-cyan-400"
        variants={{
          hover: {
            scaleX: [0, 1],
            opacity: [0, 0.2, 0],
            transition: { duration: 0.7, ease: 'easeInOut' },
          },
        }}
        style={{ originX: 0 }}
      />
    </motion.a>
  );
}
