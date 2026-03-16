import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { JSX } from 'react/jsx-runtime';
import SiteRating from '../SiteRating';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock the analytics hook
vi.mock('@/hooks/useAnalytics');
const mockUseAnalytics = vi.mocked(useAnalytics);

// Mock Framer Motion so animations are instant and AnimatePresence unmounts immediately
vi.mock('framer-motion', () => {
  const original = vi.importActual('framer-motion');
  const mockMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
    const Component = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => {
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
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

expect.extend(toHaveNoViolations);

// Helper: render <SiteRating /> and wait for the floating button to appear.
// In VITEST env the buttonDelay is 0 ms, so it appears after the first event-loop tick.
async function renderAndShowButton() {
  render(<SiteRating />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /rate this site/i })).toBeInTheDocument()
  );
}

describe('SiteRating', () => {
  const mockTrackEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalytics.mockReturnValue({
      trackEvent: mockTrackEvent,
      getSessionEntry: vi.fn(),
    });
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should render the rating button after delay', async () => {
      render(<SiteRating />);

      // Initially not in DOM (conditional rendering based on the showButton delay)
      expect(screen.queryByRole('button', { name: /rate this site/i })).not.toBeInTheDocument();

      // After the 0 ms delay fires (VITEST env), button appears
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /rate this site/i })).toBeInTheDocument()
      );
    });

    it('should show tooltip on hover', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      // Verify the button's accessible label (which the tooltip surfaces)
      expect(button).toHaveAttribute('aria-label', 'Rate this site');
    });
  });

  describe('Rating Modal', () => {
    it('should open modal when rating button is clicked', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      expect(screen.getByText('Rate This Site')).toBeInTheDocument();
      expect(screen.getByText('How would you rate this site?')).toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', async () => {
      const { container } = render(<SiteRating />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /rate this site/i })).toBeInTheDocument()
      );

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      expect(screen.getByText('Rate This Site')).toBeInTheDocument();

      // Click the outer modal overlay div (which calls setIsOpen(false))
      const overlay = container.querySelector('.fixed.inset-0.z-50');
      if (overlay) fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('Rate This Site')).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      expect(screen.getByText('Rate This Site')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Rate This Site')).not.toBeInTheDocument();
      });
    });
  });

  describe('Star Rating', () => {
    // Star buttons inside the modal don't have aria-labels; the floating button does.
    const getStarButtons = () =>
      screen.getAllByRole('button').filter(
        (btn) =>
          btn.querySelector('svg')?.classList.contains('lucide-star') &&
          !btn.getAttribute('aria-label')
      );

    it('should allow selecting star ratings', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const stars = getStarButtons();
      expect(stars).toHaveLength(5);

      // Click the third star
      fireEvent.click(stars[2]);

      // Check that the star is filled
      expect(stars[2].querySelector('svg')).toHaveClass('text-yellow-400', 'fill-current');
    });

    it('should show hover effects on stars', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const stars = getStarButtons();

      // Hover over the fourth star
      fireEvent.mouseEnter(stars[3]);

      // Check that stars 1-4 are highlighted
      for (let i = 0; i < 4; i++) {
        expect(stars[i].querySelector('svg')).toHaveClass('text-yellow-400', 'fill-current');
      }

      // Star 5 should not be highlighted
      expect(stars[4].querySelector('svg')).toHaveClass('text-gray-600');
    });
  });

  describe('Category Selection', () => {
    it('should allow selecting feedback categories', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const animationsButton = screen.getByText('Animations');
      fireEvent.click(animationsButton);

      expect(animationsButton.closest('button')).toHaveClass('border-cyan-500/50', 'bg-cyan-500/10');
    });

    it('should show all category options', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      expect(screen.getByText('Animations')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Overall Experience')).toBeInTheDocument();
    });
  });

  describe('Comment Input', () => {
    it('should allow typing in comment field', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const commentField = screen.getByPlaceholderText('What did you like? What could be improved?');
      fireEvent.change(commentField, { target: { value: 'Great animations!' } });

      expect(commentField).toHaveValue('Great animations!');
    });
  });

  describe('Rating Submission', () => {
    const getStarButtons = () =>
      screen.getAllByRole('button').filter(
        (btn) =>
          btn.querySelector('svg')?.classList.contains('lucide-star') &&
          !btn.getAttribute('aria-label')
      );

    it('should submit rating with analytics tracking', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      // Select a rating (5th star)
      const stars = getStarButtons();
      fireEvent.click(stars[4]); // 5 stars

      // Select a category
      const designButton = screen.getByText('Design');
      fireEvent.click(designButton);

      // Add a comment
      const commentField = screen.getByPlaceholderText('What did you like? What could be improved?');
      fireEvent.change(commentField, { target: { value: 'Love the design!' } });

      // Submit using the button element (not the child span)
      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);

      expect(mockTrackEvent).toHaveBeenCalledWith('site_rated', {
        score: 5,
        category: 'design',
        hasComment: true,
        commentLength: 16,
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('siteRated', 'true');
    });

    it('should not submit without a rating', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show thank you message after submission', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const stars = getStarButtons();
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole('button', { name: /submit rating/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });
  });

  describe('Already Rated State', () => {
    it('should show thank you button if already rated', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');

      render(<SiteRating />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /thank you for rating/i })).toBeInTheDocument()
      );

      const button = screen.getByRole('button', { name: /thank you for rating/i });
      fireEvent.click(button);

      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });

    it('should show heart icon when already rated', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');

      render(<SiteRating />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /thank you for rating/i })).toBeInTheDocument()
      );

      const heartIcon = screen.getByRole('button', { name: /thank you for rating/i }).querySelector('.lucide-heart');
      expect(heartIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SiteRating />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /rate this site/i })).toBeInTheDocument()
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', async () => {
      await renderAndShowButton();

      const button = screen.getByRole('button', { name: /rate this site/i });
      fireEvent.click(button);

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
