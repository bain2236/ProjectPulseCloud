import type { ReactNode } from 'react';

/**
 * Wrap matched phrases in <mark className="highlight"> elements.
 * Matching is case-insensitive; original text casing is preserved in output.
 * Returns the original string unchanged when highlights is empty/undefined.
 */
export function applyHighlights(text: string, highlights: string[]): ReactNode {
  if (!highlights || highlights.length === 0) return text;

  const escaped = highlights.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(pattern);

  if (parts.length === 1) return text;

  const lowerHighlights = highlights.map((h) => h.toLowerCase());

  return parts.map((part, i) => {
    if (lowerHighlights.includes(part.toLowerCase())) {
      return (
        <mark key={i} className="highlight">
          {part}
        </mark>
      );
    }
    return part;
  });
}
