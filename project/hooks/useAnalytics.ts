// hooks/useAnalytics.ts
// React hook for analytics integration

import { useEffect } from 'react';
import { initAnalytics, trackEvent, getSessionEntry } from '../lib/analytics';
import { consoleProvider } from '../lib/analytics-providers';

export function useAnalytics() {
  useEffect(() => {
    // Initialize with console provider for development
    // In production, this would be configured based on environment
    initAnalytics(consoleProvider);
  }, []);

  return {
    trackEvent,
    getSessionEntry
  };
}

// Predefined event tracking functions for common actions
export const useAnalyticsEvents = () => {
  const { trackEvent, getSessionEntry } = useAnalytics();

  return {
    trackTabChange: (tabName: string) => {
      trackEvent('tab_changed', { tab: tabName });
    },
    
    trackConceptClick: (concept: string, section: string) => {
      trackEvent('concept_clicked', { concept, section });
    },
    
    trackModalOpen: (modalType: string) => {
      trackEvent('modal_opened', { modalType });
    },
    
    trackModalClose: (modalType: string, duration?: number) => {
      trackEvent('modal_closed', { modalType, duration });
    },
    
    trackContactClick: (contactType: string) => {
      const session = getSessionEntry();
      trackEvent('conversion_contact', {
        contactType,
        ...(session ?? {})
      });
    },

    trackPageView: () => {
      const session = getSessionEntry();
      trackEvent('page_view', session ?? undefined);
    }
  };
};
