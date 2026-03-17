import { describe, it, expect } from 'vitest';
import React from 'react';
import { applyHighlights } from '../highlights';

describe('applyHighlights', () => {
  it('returns the original string when highlights is an empty array', () => {
    const result = applyHighlights('Hello world', []);
    expect(result).toBe('Hello world');
  });

  it('returns the original string when highlights is undefined', () => {
    // @ts-expect-error testing undefined at runtime
    const result = applyHighlights('Hello world', undefined);
    expect(result).toBe('Hello world');
  });

  it('wraps a matching phrase in a <mark> element', () => {
    const result = applyHighlights('Alex is a great leader', ['great leader']) as any[];
    expect(Array.isArray(result)).toBe(true);
    const marks = result.filter(
      (node) => typeof node === 'object' && node !== null && node.type === 'mark'
    );
    expect(marks).toHaveLength(1);
    expect(marks[0].props.children).toBe('great leader');
  });

  it('matches case-insensitively, preserving original text casing in output', () => {
    const result = applyHighlights('Alex is a Great Leader in this role', ['great leader']) as any[];
    const marks = result.filter((n) => typeof n === 'object' && n !== null && n.type === 'mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].props.children).toBe('Great Leader');
  });

  it('handles multiple non-overlapping highlights', () => {
    const result = applyHighlights('Alex leads teams and mentors juniors', [
      'leads teams',
      'mentors juniors',
    ]) as any[];
    const marks = result.filter((n) => typeof n === 'object' && n !== null && n.type === 'mark');
    expect(marks).toHaveLength(2);
    expect(marks[0].props.children).toBe('leads teams');
    expect(marks[1].props.children).toBe('mentors juniors');
  });

  it('returns plain text unchanged when no highlight matches the text', () => {
    const result = applyHighlights('Hello world', ['foobar']);
    expect(result).toBe('Hello world');
  });

  it('assigns a key to each React node in the returned array', () => {
    const result = applyHighlights('Alex is great', ['great']) as any[];
    const keys = result
      .filter((n) => typeof n === 'object' && n !== null)
      .map((n) => n.key);
    expect(keys.every((k) => k !== null && k !== undefined)).toBe(true);
  });
});
