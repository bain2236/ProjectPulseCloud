// providers/posthog.js
// Minimal PostHog wrapper (client)
export const posthogProvider = {
  trackEvent: (name, props) => {
    if (typeof posthog !== 'undefined') {
      posthog.capture(name, props);
    } else {
      console.log('[posthog]', name, props);
    }
  }
};
