// lib/analytics-providers.ts
// Provider implementations for different analytics services

import type { AnalyticsProvider } from './analytics';

// Console fallback for development
export const consoleProvider: AnalyticsProvider = {
  trackEvent: (name: string, props: Record<string, any> = {}) => {
    console.log('[analytics]', name, props);
  }
};

// Plausible provider
export const plausibleProvider: AnalyticsProvider = {
  trackEvent: (name: string, props: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(name, { props });
    } else {
      console.log('[plausible fallback]', name, props);
    }
  }
};

// PostHog provider
export const posthogProvider: AnalyticsProvider = {
  trackEvent: (name: string, props: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(name, props);
    } else {
      console.log('[posthog fallback]', name, props);
    }
  }
};
