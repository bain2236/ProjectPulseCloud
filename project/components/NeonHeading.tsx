'use client';

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface NeonHeadingProps {
  level: 1 | 2;
  children: React.ReactNode;
  delay?: number;
}

const NeonHeading: React.FC<NeonHeadingProps> = ({ level, children, delay = 0 }) => {
  const controls = useAnimation();

  const colors = level === 1 
    ? ['#00ffff', '#ff00ff'] // H1: Cyan and Magenta
    : ['#ff00ff', '#00ffff']; // H2: Magenta and Cyan
  
  const shadowFaint = `0 0 4px ${colors[0]}, 0 0 8px ${colors[1]}`;
  const shadowFull = `0 0 5px ${colors[0]}, 0 0 10px ${colors[0]}, 0 0 20px ${colors[1]}, 0 0 40px ${colors[1]}`;

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        opacity:    [0, 0.7, 1,   0.6, 1,   0.8, 1],
        textShadow: ['none', shadowFaint, shadowFull, shadowFaint, shadowFull, shadowFaint, shadowFull],
        color:      ['#aaa', '#ddd', '#fff', '#ddd', '#fff', '#ddd', '#fff'],
        filter:     ['blur(3px)', 'blur(1px)', 'blur(0px)', 'blur(1px)', 'blur(0px)', 'blur(1px)', 'blur(0px)'],
        transition: {
          duration: 2.0,
          times:    [0, 0.3, 0.4, 0.5, 0.6, 0.8, 1],
          delay,
        },
      });
    };
    sequence();
  }, [controls, delay, shadowFaint, shadowFull]);

  const hoverAnimation = {
    textShadow: [shadowFull, shadowFaint, shadowFull],
    color: ['#fff', '#ddd', '#fff'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    }
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={controls}
      whileHover={hoverAnimation}
      className="mb-8"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      <Tag
        className="font-bold tracking-wider"
      >
        {children}
      </Tag>
    </motion.div>
  );
};

export default NeonHeading;
