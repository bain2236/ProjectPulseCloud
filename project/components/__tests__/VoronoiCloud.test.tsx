import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoronoiCloud from '../VoronoiCloud';
import { Concept, Evidence } from '@/lib/types';
import { JSX } from 'react/jsx-runtime';
import '@testing-library/jest-dom';

// Mock d3-delaunay
vi.mock('d3-delaunay', () => ({
    Delaunay: {
        from: vi.fn().mockReturnThis(),
        voronoi: vi.fn(() => ({
            cellPolygon: vi.fn(() => [[0, 0], [800, 0], [800, 600], [0, 600]]),
        })),
    },
}));

// Mock Framer Motion
vi.mock('framer-motion', () => {
    const original = vi.importActual('framer-motion');
    const mockMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
        const Component = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
            const {
                animate, initial, exit, variants, transition,
                layoutId, whileHover, whileTap,
                ...rest
            } = props;
            const Tag = tag;
            return <Tag {...rest}>{children}</Tag>;
        };
        Component.displayName = `motion.${tag}`;
        return Component;
    };

    return {
        ...(typeof original === 'object' && original !== null ? original : {}),
        motion: {
            div: mockMotionComponent('div'),
            button: mockMotionComponent('button'),
            span: mockMotionComponent('span'),
            path: mockMotionComponent('path'),
            text: mockMotionComponent('text'),
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});


describe('VoronoiCloud', () => {
    const mockConcepts: Concept[] = [
        { id: 'concept-1', label: 'leadership', weight: 0.9, confidence: 0.9, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        { id: 'concept-2', label: 'mentorship', weight: 0.8, confidence: 0.8, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
    ];
    const mockEvidence: Evidence[] = [];

    it('should render a performance indicator with the correct concept count', () => {
        render(
            <VoronoiCloud
                concepts={mockConcepts}
                evidence={mockEvidence}
                width={500}
                height={500}
                onConceptClick={() => {}}
                recencyDecayDays={30}
            />
        );
        expect(screen.getByText(/2 concepts/i)).toBeInTheDocument();
    });

    it('should render the correct number of concept labels', () => {
        render(
            <VoronoiCloud
                concepts={mockConcepts}
                evidence={mockEvidence}
                width={500}
                height={500}
                onConceptClick={() => {}}
                recencyDecayDays={30}
            />
        );
        expect(screen.getByText('leadership')).toBeInTheDocument();
        expect(screen.getByText('mentorship')).toBeInTheDocument();
    });

    it('should call onConceptClick when a concept is clicked', () => {
        const handleClick = vi.fn() as (concept: Concept) => void;
        const { container } = render(
            <VoronoiCloud
                concepts={mockConcepts}
                evidence={mockEvidence}
                width={500}
                height={500}
                onConceptClick={handleClick}
                recencyDecayDays={30}
            />
        );
        
        // The clickable element is the <motion.path> with a 'cursor-pointer' class
        const conceptPaths = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(conceptPaths[0]);

        const expectedConcept = {
            ...mockConcepts[0],
            weight: 0.567, // Calculated weight: 0.9 * 0.9 * (0.6 + 0.2 * 0.5 + 0.2 * 0)
        };
        expect(handleClick).toHaveBeenCalledWith(expectedConcept);
    });

    it('should generate cells that fill the available space', () => {
        const width = 800;
        const height = 600;
        const { container } = render(
            <VoronoiCloud
                concepts={mockConcepts}
                evidence={mockEvidence}
                width={width}
                height={height}
                onConceptClick={() => {}}
                recencyDecayDays={30}
            />
        );

        const paths = container.querySelectorAll('g > path');
        expect(paths.length).toBeGreaterThan(0);

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        paths.forEach(path => {
            const d = path.getAttribute('d');
            if (!d) return;

            const points = d.replace('M', '').replace('Z', '').split('L').map(p => {
                const [x, y] = p.split(',').map(Number);
                return { x, y };
            });

            points.forEach(point => {
                if (point.x < minX) minX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.x > maxX) maxX = point.x;
                if (point.y > maxY) maxY = point.y;
            });
        });

        const tolerance = 50; // Allow for some margin
        expect(minX).toBeLessThan(tolerance);
        expect(minY).toBeLessThan(tolerance);
        expect(maxX).toBeGreaterThan(width - tolerance);
        expect(maxY).toBeGreaterThan(height - tolerance);
    });
});
