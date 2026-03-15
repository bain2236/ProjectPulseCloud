import '@testing-library/jest-dom';
import ResizeObserver from 'resize-observer-polyfill';
import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

// Mock posthog-js globally so components using usePostHog don't error in tests
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

// Mock the PulsingBorder component as it relies on browser-specific SVG APIs
vi.mock('./components/PulsingBorder', () => ({
  default: () => <div data-testid="pulsing-border-mock" />,
}));

global.ResizeObserver = ResizeObserver;
