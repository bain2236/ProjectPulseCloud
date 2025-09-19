'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delaunay } from 'd3-delaunay';
import { Concept, Evidence } from '@/lib/types';
import { weightToFontSize, weightToArea, calculateRecencyMultiplier, calculatePulseOrigin, debounce } from '@/lib/utils';

interface VoronoiCloudProps {
  concepts: Concept[];
  evidence: Evidence[];
  width: number;
  height: number;
  onConceptClick: (concept: Concept) => void;
  recencyDecayDays: number;
}

interface VoronoiCell {
  concept: Concept;
  polygon: number[][];
  centerX: number;
  centerY: number;
  fontSize: number;
  area: number;
}

interface HoverState {
  conceptId: string | null;
}

const RELAXATION_ITERATIONS = 3;
const MIN_FONT_SIZE = 10; // in pixels
const MAX_FONT_SIZE = 48; // in pixels
const FONT_SCALING_FACTOR = 0.8; // Adjust to add padding
const AVG_CHAR_ASPECT_RATIO = 0.6; // Estimated width-to-height ratio of a character

export default function VoronoiCloud({
  concepts,
  evidence,
  width,
  height,
  onConceptClick,
  recencyDecayDays
}: VoronoiCloudProps) {
  const [hoverState, setHoverState] = useState<HoverState>({ conceptId: null });
  const [dimensions, setDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Calculate Voronoi cells with recency weighting
  const voronoiCells = useMemo(() => {
    if (concepts.length === 0 || dimensions.width <= 0 || dimensions.height <= 0) {
      return [];
    }

    // Apply recency weighting to concepts
    const weightedConcepts = concepts.map(concept => {
      const relatedEvidence = evidence.filter(e => 
        concept.sourceEvidenceIds.includes(e.id)
      );
      
      const avgRecency = relatedEvidence.length > 0 
        ? relatedEvidence.reduce((sum, e) => 
            sum + calculateRecencyMultiplier(e.date, recencyDecayDays), 0
          ) / relatedEvidence.length
        : 0.5;

      // Combine weight, confidence, and evidence count for final scoring
      const evidenceBonus = Math.min(relatedEvidence.length / 3, 1); // Cap at 3 evidence pieces
      const finalWeight = concept.weight * concept.confidence * (0.6 + 0.2 * avgRecency + 0.2 * evidenceBonus);
      return { ...concept, weight: Math.min(1, finalWeight) };
    });

    // Generate one seed point per concept, then relax them using Lloyd's algorithm
    let points: [number, number][] = weightedConcepts.map(() => [
      Math.random() * dimensions.width,
      Math.random() * dimensions.height
    ]);

    // Relax the points to spread them out more evenly
    for (let i = 0; i < RELAXATION_ITERATIONS; i++) {
      const delaunay = Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, dimensions.width, dimensions.height]);
      points = points.map((point, index) => {
        const cell = voronoi.cellPolygon(index);
        if (cell) {
          const centroid = cell.reduce(
            (acc, [x, y]) => [acc[0] + x, acc[1] + y],
            [0, 0]
          );
          return [centroid[0] / cell.length, centroid[1] / cell.length];
        }
        return point; // Keep original point if cell is invalid
      });
    }

    // Create a power diagram (weighted Voronoi)
    // The weights are squared to make the area difference more pronounced
    const weights = weightedConcepts.map(c => Math.pow(c.weight * 150, 2));
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, dimensions.width, dimensions.height]);
    
    // We can't use d3-voronoi's power diagram directly, so we simulate it
    // by adjusting the polygons. This is a simplified approach.
    // A full power diagram would require a different library or a more complex implementation.

    return weightedConcepts.map((concept, index) => {
      const polygon = voronoi.cellPolygon(index);
      if (!polygon) return null;

      const [minX, minY, maxX, maxY] = polygon.reduce(
        ([minX, minY, maxX, maxY], [x, y]) => [
            Math.min(minX, x),
            Math.min(minY, y),
            Math.max(maxX, x),
            Math.max(maxY, y),
        ],
        [Infinity, Infinity, -Infinity, -Infinity]
      );
      const cellWidth = maxX - minX;
      const cellHeight = maxY - minY;

      // A more robust font size calculation.
      // We primarily scale based on the smaller of the cell's width or height,
      // and then adjust for the label's length to prevent overflow.
      const baseSize = Math.min(cellWidth, cellHeight);
      const lengthAdjustedSize = (cellWidth / concept.label.length) * 2; // Heuristic adjustment
      
      const calculatedFontSize = Math.min(baseSize, lengthAdjustedSize) * FONT_SCALING_FACTOR;
      const fontSize = Math.max(MIN_FONT_SIZE, Math.min(calculatedFontSize, MAX_FONT_SIZE));

      const sum = polygon.reduce(
        (acc, [x, y]) => [acc[0] + x, acc[1] + y],
        [0, 0]
      );
      const centerX = sum[0] / polygon.length;
      const centerY = sum[1] / polygon.length;

      return {
        concept,
        polygon,
        centerX,
        centerY,
        fontSize,
        area: 0, 
      };
    }).filter((cell): cell is VoronoiCell => cell !== null);

  }, [concepts, evidence, dimensions.width, dimensions.height, recencyDecayDays]);

  const handleMouseEnter = useCallback((conceptId: string) => {
    setHoverState({ conceptId });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverState({ conceptId: null });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm border border-gray-700">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ willChange: 'contents' }}
      >
        {/* Define gradients */}
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="100%" stopColor="#FF1493" />
          </linearGradient>
          
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF1493" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00FFFF" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Render Voronoi cells */}
        {voronoiCells.map((cell) => {
          const isHovered = hoverState.conceptId === cell.concept.id;
          const pathData = `M${cell.polygon.map(([x, y]) => `${x},${y}`).join('L')}Z`;

          return (
            <g 
              key={cell.concept.id}
            >
              {/* Cell background */}
              <motion.path
                d={pathData}
                fill="transparent"
                stroke="url(#neonGradient)"
                strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={isHovered ? 0.8 : 0.4}
                className="cursor-pointer transition-all duration-200"
                style={{ willChange: 'transform, opacity' }}
                onMouseEnter={() => handleMouseEnter(cell.concept.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onConceptClick(cell.concept)}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2, type: "spring" }
                }}
                whileTap={{ 
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
              />

              {/* Concept label */}
              <motion.text
                x={cell.centerX}
                y={cell.centerY}
                dy="0.35em" // Vertically center
                textAnchor="middle"
                fill="white"
                style={{
                  fontSize: `${cell.fontSize}px`,
                  pointerEvents: 'none',
                  textShadow: '0 0 5px rgba(0,0,0,0.7)',
                  opacity: isHovered ? 0.5 : 1,
                }}
                initial={{ opacity: 0 }}
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  textShadow: isHovered 
                    ? ['0 0 10px #00FFFF', '0 0 20px #FF1493', '0 0 10px #00FFFF']
                    : '0 0 10px rgba(255,255,255,0.5)'
                }}
                transition={{ 
                  duration: isHovered ? 0.6 : 0.3,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse"
                }}
              >
                {cell.concept.label.replace(/-/g, ' ')}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* Performance indicator */}
      <div className="absolute top-4 right-4 text-xs text-gray-500 font-mono">
        {voronoiCells.length} concepts
      </div>
    </div>
  );
}