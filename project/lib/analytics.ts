// lib/analytics.ts
// Small wrapper that queues events until a provider is initialized.

export interface AnalyticsProvider {
  trackEvent: (name: string, props?: Record<string, any>) => void;
}

interface QueuedEvent {
  name: string;
  props: Record<string, any>;
}

const queue: QueuedEvent[] = [];
let provider: AnalyticsProvider | null = null;

export function initAnalytics(p: AnalyticsProvider) {
  provider = p;
  while (queue.length) {
    const event = queue.shift();
    if (event) {
      provider.trackEvent(event.name, event.props);
    }
  }
}

export function trackEvent(name: string, props: Record<string, any> = {}) {
  if (!provider) {
    queue.push({ name, props });
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

// Session management for privacy-compliant tracking
export function getSessionEntry() {
  if (typeof window === 'undefined') return null;
  
  const sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
  const referrer = document.referrer || '';
  const utmSource = new URLSearchParams(window.location.search).get('utm_source') || '';
  
  sessionStorage.setItem('sessionId', sessionId);
  
  return {
    sessionId,
    referrer,
    utmSource,
    timestamp: Date.now()
  };
}

function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
