import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewedConcepts } from '../useViewedConcepts';

describe('useViewedConcepts', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns isViewed=false for a concept that has not been viewed', () => {
    const { result } = renderHook(() => useViewedConcepts());
    expect(result.current.isViewed('concept-1')).toBe(false);
  });

  it('returns isViewed=true after markViewed is called', () => {
    const { result } = renderHook(() => useViewedConcepts());
    act(() => {
      result.current.markViewed('concept-1');
    });
    expect(result.current.isViewed('concept-1')).toBe(true);
  });

  it('persists viewed concepts to sessionStorage', () => {
    const { result } = renderHook(() => useViewedConcepts());
    act(() => {
      result.current.markViewed('concept-2');
    });
    const stored = JSON.parse(sessionStorage.getItem('ppc_viewed_concepts') ?? '[]');
    expect(stored).toContain('concept-2');
  });

  it('reads initial state from sessionStorage on mount', () => {
    sessionStorage.setItem('ppc_viewed_concepts', JSON.stringify(['concept-3']));
    const { result } = renderHook(() => useViewedConcepts());
    expect(result.current.isViewed('concept-3')).toBe(true);
  });

  it('does not re-mark an already-viewed concept (idempotent)', () => {
    const { result } = renderHook(() => useViewedConcepts());
    act(() => {
      result.current.markViewed('concept-4');
      result.current.markViewed('concept-4');
    });
    const stored = JSON.parse(sessionStorage.getItem('ppc_viewed_concepts') ?? '[]');
    expect(stored.filter((id: string) => id === 'concept-4')).toHaveLength(1);
  });

  it('isViewed reference is stable when the viewed set does not change', () => {
    const { result, rerender } = renderHook(() => useViewedConcepts());
    const firstIsViewed = result.current.isViewed;
    rerender();
    expect(result.current.isViewed).toBe(firstIsViewed);
  });

  it('isViewed reference changes after markViewed is called', () => {
    const { result } = renderHook(() => useViewedConcepts());
    const firstIsViewed = result.current.isViewed;
    act(() => {
      result.current.markViewed('concept-5');
    });
    expect(result.current.isViewed).not.toBe(firstIsViewed);
  });
});
