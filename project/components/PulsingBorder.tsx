'use client';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface PulsingBorderProps {
  pathData: string;
}

const PULSE_LENGTH = 100; // The length of the glowing pulse

export default function PulsingBorder({ pathData }: PulsingBorderProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [pathData]);

  if (!pathData || pathLength === 0) {
    // Render a hidden path initially to measure it
    return <path d={pathData} ref={pathRef} style={{ display: 'none' }} />;
  }

  return (
    <motion.path
      d={pathData}
      ref={pathRef}
      fill="none"
      stroke="url(#pulseGradient)"
      strokeWidth={5}
      strokeDasharray={`${PULSE_LENGTH} ${pathLength - PULSE_LENGTH}`}
      style={{
        filter: 'blur(5px)',
        pointerEvents: 'none',
      }}
      initial={{ strokeDashoffset: pathLength + PULSE_LENGTH }}
      animate={{
        strokeDashoffset: -pathLength,
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
