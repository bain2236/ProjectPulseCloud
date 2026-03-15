'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Delaunay } from 'd3-delaunay';
import { Concept, Evidence } from '@/lib/types';
import { weightToFontSize, calculateRecencyMultiplier, calculatePulseOrigin, debounce } from '@/lib/utils';
import PulsingBorder from './PulsingBorder';
import { useAnalyticsEvents } from '@/hooks/useAnalytics';

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
const MAX_PROXIMITY_DISTANCE = 300; // in pixels, for the proximity effect

const MIN_TILE_SCALE = 0.4;
const MAX_TILE_SCALE = 1.2;

export default function VoronoiCloud({
  concepts,
  evidence,
  width,
  height,
  onConceptClick,
  recencyDecayDays
}: VoronoiCloudProps) {
  const { trackConceptClick } = useAnalyticsEvents();
  const [hoverState, setHoverState] = useState<HoverState>({ conceptId: null });
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selection when the concepts list changes (i.e., tab switch)
  useEffect(() => {
    setSelectedConceptId(null);
  }, [concepts]);

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

  const handleClick = (concept: Concept) => {
    setSelectedConceptId(prevId => prevId === concept.id ? null : concept.id); // Toggle selection
    trackConceptClick(concept.label, 'voronoi_cloud');
    onConceptClick(concept);
  };

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
      const evidenceBonus = Math.min(relatedEvidence.length / 2.5, 1); // Ramps up slightly slower
      const finalWeight = concept.weight * concept.confidence * (0.4 + 0.2 * avgRecency + 0.4 * evidenceBonus);
      return { ...concept, weight: Math.min(1, finalWeight) };
    });

    // Generate one seed point per concept, then relax them using Lloyd's algorithm
    let points: [number, number][] = weightedConcepts.map(() => [
      Math.random() * dimensions.width,
      Math.random() * dimensions.height
    ]);

    // Weighted CVT relaxation: high-weight concepts are attracted toward the
    // canvas centre so they accumulate more cell area after relaxation.
    const canvasCentreX = dimensions.width / 2;
    const canvasCentreY = dimensions.height / 2;
    const WEIGHT_PULL = 0.4; // fraction of canvas-centre attraction per unit weight

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
          const centroidX = centroid[0] / cell.length;
          const centroidY = centroid[1] / cell.length;
          const w = weightedConcepts[index].weight;
          const pull = w * WEIGHT_PULL;
          return [
            centroidX * (1 - pull) + canvasCentreX * pull,
            centroidY * (1 - pull) + canvasCentreY * pull,
          ];
        }
        return point;
      });
    }
    
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, dimensions.width, dimensions.height]);

    return weightedConcepts.map((concept, index) => {
      const polygon = voronoi.cellPolygon(index);
      if (!polygon) return null;

      // Inscribed radius: minimum perpendicular distance from centroid to any edge.
      // This avoids overestimating usable space in elongated cells.
      const sum = polygon.reduce(
        (acc, [x, y]) => [acc[0] + x, acc[1] + y],
        [0, 0]
      );
      const centroidX = sum[0] / polygon.length;
      const centroidY = sum[1] / polygon.length;

      let inscribedRadius = Infinity;
      for (let j = 0; j < polygon.length - 1; j++) {
        const [x1, y1] = polygon[j];
        const [x2, y2] = polygon[j + 1];
        const num = Math.abs((y2 - y1) * centroidX - (x2 - x1) * centroidY + x2 * y1 - y2 * x1);
        const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
        if (den > 0) inscribedRadius = Math.min(inscribedRadius, num / den);
      }
      if (!isFinite(inscribedRadius)) inscribedRadius = 10; // fallback for degenerate cells

      const availableWidth  = 2 * inscribedRadius * 0.8;
      const availableHeight = 2 * inscribedRadius * 0.6;
      const label = concept.label.replace(/-/g, ' ');
      const widthBound = (availableWidth / label.length) * AVG_CHAR_ASPECT_RATIO;
      const calculatedFontSize = Math.min(widthBound, availableHeight, MAX_FONT_SIZE);
      const fontSize = Math.max(calculatedFontSize, MIN_FONT_SIZE);

      const centerX = centroidX;
      const centerY = centroidY;

      return {
        concept,
        polygon,
        centerX,
        centerY,
        fontSize,
        area: 0, 
      };
    }).filter((cell): cell is NonNullable<typeof cell> => cell !== null);

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

          {/* Per-cell clip paths — one polygon path per concept */}
          {voronoiCells.map((cell) => {
            const pathData = `M${cell.polygon.map(([x, y]) => `${x},${y}`).join('L')}Z`;
            return (
              <clipPath key={`clip-def-${cell.concept.id}`} id={`clip-${cell.concept.id}`}>
                <path d={pathData} />
              </clipPath>
            );
          })}
        </defs>

        {/* Render Voronoi cells */}
        {voronoiCells.map((cell) => {
          const isHovered = hoverState.conceptId === cell.concept.id;
          const isSelected = selectedConceptId === cell.concept.id;
          const pathData = `M${cell.polygon.map(([x, y]) => `${x},${y}`).join('L')}Z`;

          return (
            <g 
              key={cell.concept.id}
            >
              {/* Cell background */}
              <motion.path
                d={pathData}
                fill="transparent"
              />

              {/* Cell border */}
              <motion.path
                d={pathData}
                fill="transparent"
                stroke="url(#neonGradient)"
                strokeOpacity={0.4}
                onMouseEnter={() => handleMouseEnter(cell.concept.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(cell.concept)}
                className="cursor-pointer"
                animate={{
                  strokeWidth: isSelected ? 3 : 1,
                  strokeOpacity: isSelected ? 0.9 : 0.4,
                }}
                whileTap={{ 
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
              />

              {(isHovered || isSelected) && (
                <PulsingBorder pathData={pathData} />
              )}

              {/* Concept label — clipped to cell polygon */}
              <g clipPath={`url(#clip-${cell.concept.id})`}>
                <motion.text
                  x={cell.centerX}
                  y={cell.centerY}
                  dy="0.35em"
                  textAnchor="middle"
                  fill="white"
                  style={{
                    fontSize: `${cell.fontSize}px`,
                    pointerEvents: 'none',
                    textShadow: '0 0 5px rgba(0,0,0,0.7)',
                  }}
                  animate={{
                    scale: isHovered || isSelected ? 1.1 : 1,
                    textShadow: isHovered || isSelected
                      ? '0 0 15px #FFFFFF'
                      : '0 0 5px rgba(0,0,0,0.7)'
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    duration: 0.3,
                    type: 'spring', stiffness: 300, damping: 20
                  }}
                >
                  {cell.concept.label.replace(/-/g, ' ')}
                </motion.text>
              </g>
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