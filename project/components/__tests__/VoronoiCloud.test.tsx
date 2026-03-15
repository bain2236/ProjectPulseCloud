import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoronoiCloud from '../VoronoiCloud';
import { Concept, Evidence } from '../../lib/types';
import { JSX } from 'react/jsx-runtime';
import '@testing-library/jest-dom';
import { Delaunay } from 'd3-delaunay';
import { axe } from 'jest-axe';
import * as utils from '../../lib/utils';

// Mock d3-delaunay to control its output in tests
vi.mock('d3-delaunay', () => {
    // This is the mock for the innermost function we need to control
    const cellPolygonMock = vi.fn();
    
    // This is the mock for the object returned by .voronoi()
    const voronoiMock = {
        cellPolygon: cellPolygonMock,
    };

    // This is the mock for the object returned by Delaunay.from()
    const delaunayMock = {
        voronoi: vi.fn().mockReturnValue(voronoiMock),
    };

    return {
        __esModule: true,
        Delaunay: {
            from: vi.fn(() => delaunayMock),
        },
        // Expose the innermost mock for tests to control
        _cellPolygonMock: cellPolygonMock, 
    };
});

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

// Helper to parse transform: scale(X) style
const getScale = (element: HTMLElement): number => {
    if (!element || !element.style.transform) return 1; // Default scale
    const match = element.style.transform.match(/scale\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
};

// Module-level mock reference — shared across all describe blocks
let cellPolygonMock: vi.Mock;

beforeEach(async () => {
    // Dynamically import to get the EXPOSED mock function
    const mockModule = await import('d3-delaunay');
    cellPolygonMock = (mockModule as any)._cellPolygonMock;
    cellPolygonMock.mockClear();
});

describe('VoronoiCloud', () => {

    const mockEvidence: Evidence[] = [];
    const mockConcepts: Concept[] = [
        { id: 'concept-1', label: 'leadership', weight: 0.9, confidence: 0.9, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        { id: 'concept-2', label: 'mentorship', weight: 0.8, confidence: 0.8, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
    ];

    it('should render a performance indicator with the correct concept count', () => {
        const mockConcepts: Concept[] = [
            { id: 'leadership', label: 'leadership', weight: 0.9, confidence: 1, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
            { id: 'mentorship', label: 'mentorship', weight: 0.8, confidence: 0.9, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        ];

        cellPolygonMock.mockReturnValue([[0, 0], [10, 0], [10, 10], [0, 10]]);

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
        const mockConcepts: Concept[] = [
            { id: 'leadership', label: 'leadership', weight: 0.9, confidence: 1, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
            { id: 'mentorship', label: 'mentorship', weight: 0.8, confidence: 0.9, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        ];

        // Mock the cellPolygon function
        cellPolygonMock.mockReturnValue([[0, 0], [10, 0], [10, 10], [0, 10]]);

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
        const handleClick = vi.fn();
        const mockConcepts: Concept[] = [
            { id: 'concept-1', label: 'Test Concept 1', weight: 0.9, confidence: 1, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        ];

        // Mock the cellPolygon function
        cellPolygonMock.mockReturnValue([[0, 0], [10, 0], [10, 10], [0, 10]]);

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
            weight: 0.45, // Updated for new ambitious scaling
        };
        expect(handleClick).toHaveBeenCalledWith(expectedConcept);
    });

    it('should render the concept label near the center of its cell', () => {
        // Provide a single, specific, offset polygon for this test
        const testPolygon = [[100, 100], [200, 100], [200, 200], [100, 200]];
        cellPolygonMock.mockReturnValue(testPolygon);

        const concept: Concept[] = [
            { id: 'center-me', label: 'Center Me', weight: 0.5, confidence: 1, sourceEvidenceIds: [], tabId: 'leader', createdByLLM: false, createdAt: '' },
        ];

        render(
            <VoronoiCloud
                concepts={concept}
                evidence={mockEvidence}
                width={800}
                height={600}
                onConceptClick={() => {}}
                recencyDecayDays={30}
            />
        );

        const textElement = screen.getByText('Center Me');

        // Expected centroid for the testPolygon is (150, 150)
        const expectedCenterX = 150;
        const expectedCenterY = 150;

        expect(parseFloat(textElement.getAttribute('x')!)).toBeCloseTo(expectedCenterX);
        expect(parseFloat(textElement.getAttribute('y')!)).toBeCloseTo(expectedCenterY);
    });

    it('should have no accessibility violations', async () => {
        cellPolygonMock.mockReturnValue([[0, 0], [10, 0], [10, 10], [0, 10]]);

        const { container } = render(
            <VoronoiCloud
                concepts={mockConcepts}
                evidence={mockEvidence}
                width={500}
                height={500}
                onConceptClick={() => {}}
                recencyDecayDays={30}
            />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});

describe('utils — dead code removed', () => {
  it('weightToArea should not exist in utils', () => {
    expect((utils as any).weightToArea).toBeUndefined();
  });
});

describe('weighted CVT — high-weight concept gets larger cell area', () => {
  it('renders without crashing when concepts have varying weights', () => {
    // This is a smoke test: the weighted CVT should not throw or produce null cells.
    // We cannot verify area ratios without a real d3-delaunay instance,
    // but we verify that the rendered concept count matches input.
    const highLowConcepts: Concept[] = [
      { id: 'high', label: 'alpha', weight: 1.0, confidence: 1.0, sourceEvidenceIds: [], tabId: 't1', createdByLLM: false, createdAt: '' },
      { id: 'low',  label: 'beta',  weight: 0.1, confidence: 1.0, sourceEvidenceIds: [], tabId: 't1', createdByLLM: false, createdAt: '' },
      { id: 'mid',  label: 'gamma', weight: 0.5, confidence: 1.0, sourceEvidenceIds: [], tabId: 't1', createdByLLM: false, createdAt: '' },
    ];

    cellPolygonMock.mockReturnValue([[0, 0], [100, 0], [100, 100], [0, 100]]);

    render(
      <VoronoiCloud
        concepts={highLowConcepts}
        evidence={[]}
        width={600}
        height={600}
        onConceptClick={() => {}}
        recencyDecayDays={30}
      />
    );

    expect(screen.getByText('3 concepts')).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.getByText('gamma')).toBeInTheDocument();
  });
});
