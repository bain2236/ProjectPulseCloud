import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabStrip from '../TabStrip';
import { Tab } from '@/lib/types';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';

// Mock Framer Motion
vi.mock('framer-motion', () => {
    const original = vi.importActual('framer-motion');

    // Create a mock component that forwards all props
    const mockMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
        const Component = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
            // Filter out framer-motion specific props
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
        ...original,
        motion: {
            div: mockMotionComponent('div'),
            button: mockMotionComponent('button'),
            span: mockMotionComponent('span'),
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});


describe('TabStrip', () => {
    const mockTabs: Tab[] = [
        { id: 'personal', title: 'Personal', order: 0 },
        { id: 'leader', title: 'Leader', order: 1 },
        { id: 'engineer', title: 'Engineer', order: 2 },
    ];

    it('should render nothing if the tabs array is empty', () => {
        const { container } = render(
            <TabStrip tabs={[]} activeTab="personal" onTabChange={() => {}} />
        );
        // The main container has a class of 'flex'
        expect(container.querySelector('.flex')).toBeNull();
    });

    it('should render the correct number of tabs', () => {
        render(<TabStrip tabs={mockTabs} activeTab="personal" onTabChange={() => {}} />);
        const tabElements = screen.getAllByRole('button');
        expect(tabElements).toHaveLength(mockTabs.length);
    });

    it('should display the tab titles', () => {
        render(<TabStrip tabs={mockTabs} activeTab="personal" onTabChange={() => {}} />);
        mockTabs.forEach(tab => {
            expect(screen.getByText(tab.title)).toBeInTheDocument();
        });
    });

    it('should call onTabChange with the correct id when a tab is clicked', () => {
        const handleTabChange = vi.fn();
        render(<TabStrip tabs={mockTabs} activeTab="personal" onTabChange={handleTabChange} />);
        
        const leaderTab = screen.getByText('Leader');
        fireEvent.click(leaderTab);
        
        expect(handleTabChange).toHaveBeenCalledWith('leader');
    });

    it('should apply active styles to the active tab', () => {
        render(
            <TabStrip tabs={mockTabs} activeTab="engineer" onTabChange={() => {}} />
        );
        const engineerTabButton = screen.getByText('Engineer');
        // The active button should have 'text-white' and the inactive ones 'text-gray-400'
        expect(engineerTabButton.closest('button')).toHaveClass('text-white');
        
        const leaderTabButton = screen.getByText('Leader');
        expect(leaderTabButton.closest('button')).toHaveClass('text-gray-300');
    });

    it('should have no accessibility violations', async () => {
        const { container } = render(
            <TabStrip tabs={mockTabs} activeTab="engineer" onTabChange={() => {}} />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
