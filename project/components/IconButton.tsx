'use client';

import { motion } from 'framer-motion';
import { LucideProps } from 'lucide-react';
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IconButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

export default function IconButton({ href, label, icon: Icon }: IconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group relative flex items-center justify-center w-12 h-12 bg-black border-2 border-cyan-400/50 rounded-lg overflow-hidden transition-colors hover:border-cyan-400"
            whileHover="hover"
          >
            <Icon className="w-6 h-6 text-cyan-400/70 transition-colors group-hover:text-cyan-400" />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={{
                hover: {
                  x: ['-100%', '100%'],
                  transition: { duration: 0.8, ease: 'linear' },
                },
              }}
            />
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 border-2 border-cyan-400 rounded-lg"
              variants={{
                hover: {
                  scale: 1.2,
                  opacity: [0, 1, 0],
                  boxShadow: '0 0 15px #00FFFF, 0 0 25px #00FFFF',
                  transition: { duration: 0.8, ease: 'easeInOut' },
                },
              }}
            />
          </motion.a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
