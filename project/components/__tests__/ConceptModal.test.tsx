import { render, screen, fireEvent } from '@testing-library/react';
import ConceptModal from '../ConceptModal';
import { Concept, Evidence } from '@/lib/types';
import '@testing-library/jest-dom';

// Mock Framer Motion
jest.mock('framer-motion', () => {
    const original = jest.requireActual('framer-motion');
    const mockMotionComponent = (tag) => {
        const Component = ({ children, ...props }) => {
            const {
                animate, initial, exit, variants, transition,
                layoutId, whileHover, whileTap, layout,
                ...rest
            } = props;
            const Tag = tag;
            return <Tag {...rest}>{children}</Tag>;
        };
        Component.displayName = `motion.${tag}`;
        return Component;
    };

    return {
        ...original,
        motion: {
            div: mockMotionComponent('div'),
            button: mockMotionComponent('button'),
            span: mockMotionComponent('span'),
            p: mockMotionComponent('p'),
            h2: mockMotionComponent('h2'),
            h3: mockMotionComponent('h3'),
        },
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

describe('ConceptModal', () => {
    const mockConcept: Concept = {
        id: 'concept-001',
        label: 'leadership',
        tabId: 'leader',
        weight: 0.9,
        confidence: 0.9,
        sourceEvidenceIds: ['evidence-001'],
        createdByLLM: false,
        createdAt: '2025-09-18T00:00:00Z',
    };

    const mockEvidence: Evidence[] = [
        {
            id: 'evidence-001',
            tabId: 'leader',
            source: 'LinkedIn Recommendation',
            author: 'Phil Davies',
            authorRole: 'CIO at Clinithink',
            date: '2025-09-02',
            text: 'Alex is extremely positive and is a real asset to any team.',
            imageUrl: null,
            externalUrl: null,
            createdAt: '2025-09-18T00:00:00Z',
        },
    ];

    it('should render nothing when concept is null', () => {
        const { container } = render(
            <ConceptModal concept={null} evidence={[]} onClose={() => {}} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render the modal when a concept is provided', () => {
        render(
            <ConceptModal concept={mockConcept} evidence={mockEvidence} onClose={() => {}} />
        );
        expect(screen.getByText('leadership')).toBeInTheDocument();
        expect(screen.getByText(/Supporting Evidence/i)).toBeInTheDocument();
    });

    it('should display the correct evidence for the concept', () => {
        render(
            <ConceptModal concept={mockConcept} evidence={mockEvidence} onClose={() => {}} />
        );
        expect(screen.getByText('Phil Davies')).toBeInTheDocument();
        expect(screen.getByText(/Alex is extremely positive/)).toBeInTheDocument();
    });

    it('should call onClose when the close button is clicked', () => {
        const handleClose = jest.fn();
        render(
            <ConceptModal concept={mockConcept} evidence={mockEvidence} onClose={handleClose} />
        );
        
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should display a message when there is no evidence', () => {
        const conceptWithoutEvidence = { ...mockConcept, sourceEvidenceIds: [] };
        render(
            <ConceptModal concept={conceptWithoutEvidence} evidence={mockEvidence} onClose={() => {}} />
        );
        expect(screen.getByText(/No evidence found/i)).toBeInTheDocument();
    });
});
