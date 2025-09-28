'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface NeonHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

const NeonHeading: React.FC<NeonHeadingProps> = ({ level, children }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });
  const [isAnimating, setIsAnimating] = useState(true);

  const colors = level === 1 
    ? ['#00ffff', '#ff00ff'] // H1: Cyan and Magenta
    : ['#ff00ff', '#00ffff']; // H2: Magenta and Cyan

  const textShadow = `
    0 0 5px ${colors[0]},
    0 0 10px ${colors[0]},
    0 0 20px ${colors[1]},
    0 0 40px ${colors[1]}
  `;

  useEffect(() => {
    if (inView) {
      // Once in view, stop the intense flickering after a delay
      setTimeout(() => setIsAnimating(false), 2000);
      controls.start({
        opacity: 1,
        transition: { duration: 1 },
      });
    }
  }, [inView, controls]);

  const flickerAnimation = {
    opacity: [1, 0.8, 1, 0.9, 0.7, 1, 0.85, 1],
    transition: {
      duration: 0.5 + Math.random() * 1.5, // Slower flicker further down
      repeat: Infinity,
    },
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className="mb-8"
    >
      <Tag
        className="font-bold tracking-wider"
        style={{
          color: '#fff',
          textShadow: textShadow,
          animation: isAnimating ? `flicker ${1 + level * 0.5}s infinite alternate` : 'none',
        }}
      >
        <motion.span animate={isAnimating ? flickerAnimation : { opacity: 1 }}>
          {children}
        </motion.span>
      </Tag>
      <style jsx global>{`
        @keyframes flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            text-shadow:
              0 0 4px #fff,
              0 0 11px ${colors[0]},
              0 0 19px ${colors[0]},
              0 0 40px ${colors[1]},
              0 0 80px ${colors[1]};
          }
          20%, 24%, 55% {
            text-shadow: none;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default NeonHeading;
