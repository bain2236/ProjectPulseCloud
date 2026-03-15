'use client';

// components/PostHogProvider.tsx
// Initialises PostHog EU Cloud once on mount.
// Cookie-less (persistence: 'memory'), no IP capture, no autocapture.
// Wrapped around <body> in layout.tsx.

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set — analytics disabled.');
      return;
    }

    posthog.init(key, {
      api_host: 'https://eu.i.posthog.com',
      persistence: 'memory',           // cookie-less: no cookies, no localStorage
      ip: false,                        // do not store IP addresses
      capture_pageview: true,           // automatic page view on load
      capture_pageleave: true,          // automatic page leave event
      autocapture: false,               // manual events only — no DOM click capture
      disable_session_recording: true,  // no session replay
    });
  }, []);

  return <>{children}</>;
}
