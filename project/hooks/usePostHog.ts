// hooks/usePostHog.ts
// Thin wrapper around posthog.capture() for use in components.
// PostHog is initialised by PostHogProvider in layout.tsx — this hook
// is safe to call before initialisation (posthog-js queues events internally).

import posthog from 'posthog-js';

export function usePostHog() {
  function capture(event: string, properties?: Record<string, unknown>) {
    posthog.capture(event, properties);
  }

  return { capture };
}
