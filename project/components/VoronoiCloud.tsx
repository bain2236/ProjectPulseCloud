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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleResize = debounce(() => {
      setDimensions({ width, height });
    }, 150);

    handleResize();

    // Cleanup the debounced function on component unmount
    return () => {
      handleResize.cancel();
    };
  }, [width, height]);

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

    // Calculate total weight for proportional distribution
    const totalWeight = weightedConcepts.reduce((sum, concept) => sum + concept.weight, 0);
    
    // Generate seed points for Voronoi diagram - distribute across canvas based on weight
    const points: [number, number][] = [];
    const conceptMapping: { [key: number]: Concept } = {};
    
    // Create a grid-like distribution but weighted by concept importance
    weightedConcepts.forEach(concept => {
      // Calculate how many seed points this concept should get based on its relative weight
      const relativeWeight = concept.weight / totalWeight;
      const targetArea = relativeWeight * dimensions.width * dimensions.height;
      const numPoints = Math.max(1, Math.floor(Math.sqrt(targetArea) / 50)); // Adjust density
      
      for (let i = 0; i < numPoints; i++) {
        // Distribute points more evenly across the canvas
        const angle = (i / numPoints) * 2 * Math.PI + Math.random() * 0.5;
        const radius = Math.sqrt(targetArea) * 0.1 * Math.random();
        const centerX = dimensions.width * (0.1 + Math.random() * 0.8);
        const centerY = dimensions.height * (0.1 + Math.random() * 0.8);
        
        const x = centerX + Math.cos(angle) * radius * Math.random();
        const y = centerY + Math.sin(angle) * radius * Math.random();
        
        const pointIndex = points.length;
        points.push([
          Math.max(5, Math.min(dimensions.width - 5, x)),
          Math.max(5, Math.min(dimensions.height - 5, y))
        ]);
        conceptMapping[pointIndex] = concept;
      }
    });

    if (points.length < 3) return [];

    // Create Delaunay triangulation and Voronoi diagram
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, dimensions.width, dimensions.height]);

    // Group cells by concept and calculate proper centers
    const conceptCells: { [key: string]: VoronoiCell } = {};

    points.forEach((point, index) => {
      const concept = conceptMapping[index];
      if (!concept) return;

      const cell = voronoi.cellPolygon(index);
      if (!cell) return;

      // Calculate the actual centroid of the polygon for better text positioning
      const centroid = cell.reduce(
        (acc, [x, y]) => [acc[0] + x, acc[1] + y],
        [0, 0]
      ).map(coord => coord / cell.length);

      if (!conceptCells[concept.id]) {
        conceptCells[concept.id] = {
          concept,
          polygon: cell,
          centerX: centroid[0],
          centerY: centroid[1],
          fontSize: weightToFontSize(concept.weight),
          area: weightToArea(concept.weight)
        };
      } else {
        // Merge cells for the same concept by averaging centroids
        const existing = conceptCells[concept.id];
        existing.centerX = (existing.centerX + centroid[0]) / 2;
        existing.centerY = (existing.centerY + centroid[1]) / 2;
        
        // Merge polygons by taking the larger one (simplified approach)
        const currentArea = cell.reduce((sum, [x, y], i, arr) => {
          const next = arr[(i + 1) % arr.length];
          return sum + (x * next[1] - next[0] * y);
        }, 0) / 2;
        
        const existingArea = existing.polygon.reduce((sum, [x, y], i, arr) => {
          const next = arr[(i + 1) % arr.length];
          return sum + (x * next[1] - next[0] * y);
        }, 0) / 2;
        
        if (Math.abs(currentArea) > Math.abs(existingArea)) {
          existing.polygon = cell;
        }
      }
    });

    return Object.values(conceptCells);
  }, [concepts, evidence, dimensions.width, dimensions.height, recencyDecayDays]);

  const handleMouseEnter = useCallback((conceptId: string) => {
    setHoverState({ conceptId });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverState({ conceptId: null });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm border border-gray-700">
      <svg
        ref={svgRef}
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
            <g key={cell.concept.id}>
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
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={cell.fontSize}
                fill="white"
                fontWeight="600"
                className="pointer-events-none select-none font-mono"
                style={{ 
                  textShadow: '0 0 10px rgba(255,255,255,0.5)',
                  willChange: 'transform'
                }}
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