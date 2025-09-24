import { describe, it, expect } from 'vitest';
import { extractKeywords } from '../../data/3_pipeline/keywordExtractor';

describe('Keyword Extractor', () => {
  it('should extract keywords case-insensitively and return concept objects', () => {
    const text = "My skills include React, leadership, and python.";
    const keywords = {
      technical: ["React", "Python"],
      soft: ["Leadership"]
    };

    const concepts = extractKeywords(text, keywords);

    expect(concepts).toHaveLength(3);
    expect(concepts).toContainEqual({
      id: expect.any(String),
      label: 'React',
      tabId: 'engineer',
      weight: expect.any(Number), // ENFORCE WEIGHT
      sourceEvidenceIds: [], // This will be populated by the assembler
    });
    expect(concepts).toContainEqual({
      id: expect.any(String),
      label: 'Leadership',
      tabId: 'leader',
      weight: expect.any(Number), // ENFORCE WEIGHT
      sourceEvidenceIds: [],
    });
    expect(concepts).toContainEqual({
      id: expect.any(String),
      label: 'Python',
      tabId: 'engineer',
      weight: expect.any(Number), // ENFORCE WEIGHT
      sourceEvidenceIds: [],
    });
  });

  it('should not extract keywords that are substrings of other words', () => {
    const text = "I am reacting to the situation.";
    const keywords = { technical: ["React"], soft: [] };
    const concepts = extractKeywords(text, keywords);
    expect(concepts).toHaveLength(0);
  });
});
