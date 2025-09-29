// providers/plausible.js
// Minimal Plausible provider wrapper (client)
export const plausibleProvider = {
  trackEvent: (name, props) => {
    if (typeof plausible !== 'undefined') {
      plausible(name, { props });
    } else {
      console.log('[plausible]', name, props);
    }
  }
};
