import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import VoronoiCloud from '../VoronoiCloud';
import { Concept, Evidence } from '@/lib/types';
import { JSX } from 'react/jsx-runtime';
import '@testing-library/jest-dom';

// Mock Framer Motion
jest.mock('framer-motion', () => {
    const original = jest.requireActual('framer-motion');
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
        const handleClick = jest.fn() as (concept: Concept) => void;
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
});
