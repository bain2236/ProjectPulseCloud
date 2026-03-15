import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import posthog from 'posthog-js';
import PostHogProvider from '../PostHogProvider';
import '@testing-library/jest-dom';

// posthog-js is mocked globally in vitest.setup.tsx

describe('PostHogProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders children', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';

    render(
      <PostHogProvider>
        <div data-testid="child">Hello</div>
      </PostHogProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls posthog.init with EU endpoint and cookie-less config when key is present', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';

    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>
    );

    await waitFor(() => {
      expect(posthog.init).toHaveBeenCalledTimes(1);
    });

    const [calledKey, calledConfig] = (posthog.init as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledKey).toBe('phc_test_key');
    expect(calledConfig.api_host).toBe('https://eu.i.posthog.com');
    expect(calledConfig.persistence).toBe('memory');
    expect(calledConfig.ip).toBe(false);
    expect(calledConfig.autocapture).toBe(false);
    expect(calledConfig.disable_session_recording).toBe(true);
  });

  it('does not call posthog.init when NEXT_PUBLIC_POSTHOG_KEY is not set', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>
    );

    // Wait a tick for useEffect to run
    await waitFor(() => {
      expect(posthog.init).not.toHaveBeenCalled();
    });
  });
});
