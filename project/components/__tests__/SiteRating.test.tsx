import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import SiteRating from '../SiteRating';
import { useAnalyticsEvents } from '@/hooks/useAnalytics';

// Mock the analytics hook
vi.mock('@/hooks/useAnalytics');
const mockUseAnalyticsEvents = vi.mocked(useAnalyticsEvents);

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

describe('SiteRating', () => {
  const mockTrackEvent = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsEvents.mockReturnValue({
      trackEvent: mockTrackEvent,
      getSessionEntry: vi.fn(),
    });
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should render the rating button after delay', async () => {
      render(<SiteRating />);
      
      // Initially not visible
      expect(screen.queryByRole('button', { name: /rate this site/i })).not.toBeInTheDocument();
      
      // Wait for the delay and animation
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show tooltip on hover', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText('Rate this site')).toBeInTheDocument();
      });
    });
  });

  describe('Rating Modal', () => {
    it('should open modal when rating button is clicked', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Rate This Site')).toBeInTheDocument();
      expect(screen.getByText('How would you rate this site?')).toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Rate This Site')).toBeInTheDocument();
      
      // Click backdrop
      const backdrop = screen.getByRole('button').closest('div')?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Rate This Site')).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
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
    it('should allow selecting star ratings', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const stars = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
      
      expect(stars).toHaveLength(5);
      
      // Click the third star
      fireEvent.click(stars[2]);
      
      // Check that the star is filled
      expect(stars[2].querySelector('svg')).toHaveClass('text-yellow-400', 'fill-current');
    });

    it('should show hover effects on stars', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const stars = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
      
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
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const animationsButton = screen.getByText('Animations');
      fireEvent.click(animationsButton);
      
      expect(animationsButton.closest('button')).toHaveClass('border-cyan-500/50', 'bg-cyan-500/10');
    });

    it('should show all category options', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Animations')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Overall Experience')).toBeInTheDocument();
    });
  });

  describe('Comment Input', () => {
    it('should allow typing in comment field', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const commentField = screen.getByPlaceholderText('What did you like? What could be improved?');
      fireEvent.change(commentField, { target: { value: 'Great animations!' } });
      
      expect(commentField).toHaveValue('Great animations!');
    });
  });

  describe('Rating Submission', () => {
    it('should submit rating with analytics tracking', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Select a rating
      const stars = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
      fireEvent.click(stars[4]); // 5 stars
      
      // Select a category
      const designButton = screen.getByText('Design');
      fireEvent.click(designButton);
      
      // Add a comment
      const commentField = screen.getByPlaceholderText('What did you like? What could be improved?');
      fireEvent.change(commentField, { target: { value: 'Love the design!' } });
      
      // Submit
      const submitButton = screen.getByText('Submit Rating');
      fireEvent.click(submitButton);
      
      // Check analytics tracking
      expect(mockTrackEvent).toHaveBeenCalledWith('site_rated', {
        score: 5,
        category: 'design',
        hasComment: true,
        commentLength: 16,
      });
      
      // Check sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('siteRated', 'true');
    });

    it('should not submit without a rating', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const submitButton = screen.getByText('Submit Rating');
      expect(submitButton).toBeDisabled();
    });

    it('should show thank you message after submission', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Select a rating and submit
      const stars = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
      fireEvent.click(stars[4]);
      
      const submitButton = screen.getByText('Submit Rating');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });
  });

  describe('Already Rated State', () => {
    it('should show thank you button if already rated', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');
      
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });

    it('should show heart icon when already rated', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');
      
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      // Should show heart icon instead of star
      const heartIcon = screen.getByRole('button').querySelector('.lucide-heart');
      expect(heartIcon).toBeInTheDocument();
    });
  });

  describe('Mobile positioning', () => {
    it('applies bottom-4 right-4 positioning classes to the floating button', async () => {
      render(<SiteRating />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bottom-4');
      expect(button).toHaveClass('right-4');
    });

    it('applies bottom-4 right-4 to the already-rated heart button', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');

      render(<SiteRating />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bottom-4');
      expect(button).toHaveClass('right-4');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', async () => {
      render(<SiteRating />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
