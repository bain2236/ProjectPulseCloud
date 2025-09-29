// lib/analytics.js
// Small wrapper that queues events until a provider is initialized.
const queue = [];
let provider = null;

export function initAnalytics(p) {
  provider = p;
  while (queue.length) {
    const [name, props] = queue.shift();
    provider.trackEvent(name, props);
  }
}

export function trackEvent(name, props = {}) {
  if (!provider) {
    queue.push([name, props]);
    // local fallback for development
    console.log('[analytics queued]', name, props);
    return;
  }
  try {
    provider.trackEvent(name, props);
  } catch (err) {
    console.error('analytics error', err);
  }
}
