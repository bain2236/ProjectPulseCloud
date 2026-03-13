import { describe, it, expect } from 'vitest';
import { scaleWeights } from '../3_pipeline/weightScaler';
import { Concept, Evidence } from '../../lib/types';

describe('Weight Scaling Logic', () => {

  it('should increase weight for concepts with multiple evidence sources', () => {
    const concepts: Concept[] = [
      { id: 'concept-1', label: 'TDD', sourceEvidenceIds: ['evidence-1', 'evidence-2'], weight: 0.5, tabId: 'engineer' },
    ];
    const evidence: Evidence[] = [
      { id: 'evidence-1', source: 'CV', date: '2023-01-01', text: '', author: '' },
      { id: 'evidence-2', source: 'CV', date: '2023-01-01', text: '', author: '' },
    ];

    const scaledConcepts = scaleWeights(concepts, evidence);
    expect(scaledConcepts[0].weight).toBeGreaterThan(0.5);
  });

  it('should assign a higher weight to concepts from more authoritative sources', () => {
    // Both concepts in the same tab so per-tab normalisation preserves relative ordering
    const concepts: Concept[] = [
      { id: 'concept-cv', label: 'React', sourceEvidenceIds: ['evidence-cv'], weight: 0.6, tabId: 'engineer' },
      { id: 'concept-hobby', label: 'Painting', sourceEvidenceIds: ['evidence-hobby'], weight: 0.6, tabId: 'engineer' },
    ];
    const evidence: Evidence[] = [
      { id: 'evidence-cv', source: 'CV', date: '2023-01-01', text: '', author: '' },
      { id: 'evidence-hobby', source: 'Personal Hobby Log', date: '2023-01-01', text: '', author: '' },
    ];

    const scaledConcepts = scaleWeights(concepts, evidence);
    const reactConcept = scaledConcepts.find(c => c.label === 'React');
    const paintingConcept = scaledConcepts.find(c => c.label === 'Painting');

    expect(reactConcept!.weight).toBeGreaterThan(paintingConcept!.weight);
  });

  it('should apply recency decay, giving higher weight to more recent evidence', () => {
    const concepts: Concept[] = [
      { id: 'concept-new', label: 'Recent Skill', sourceEvidenceIds: ['evidence-new'], weight: 0.7, tabId: 'engineer' },
      { id: 'concept-old', label: 'Old Skill', sourceEvidenceIds: ['evidence-old'], weight: 0.7, tabId: 'engineer' },
    ];
    const evidence: Evidence[] = [
      { id: 'evidence-new', source: 'CV', date: new Date().toISOString(), text: '', author: '' }, // Today
      { id: 'evidence-old', source: 'CV', date: '2020-01-01', text: '', author: '' }, // Years ago
    ];

    const scaledConcepts = scaleWeights(concepts, evidence);
    const newSkill = scaledConcepts.find(c => c.label === 'Recent Skill');
    const oldSkill = scaledConcepts.find(c => c.label === 'Old Skill');

    expect(newSkill!.weight).toBeGreaterThan(oldSkill!.weight);
  });

  it('should cap the final weight at 1.0, even with many bonuses', () => {
    const concepts: Concept[] = [
      { id: 'concept-1', label: 'Maxed Out', sourceEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'], weight: 0.9, tabId: 'engineer' },
    ];
    const evidence: Evidence[] = [
      { id: 'e1', source: 'CV', date: new Date().toISOString(), text: '', author: '' },
      { id: 'e2', source: 'CV', date: new Date().toISOString(), text: '', author: '' },
      { id: 'e3', source: 'CV', date: new Date().toISOString(), text: '', author: '' },
      { id: 'e4', source: 'CV', date: new Date().toISOString(), text: '', author: '' },
      { id: 'e5', source: 'CV', date: new Date().toISOString(), text: '', author: '' },
    ];

    const scaledConcepts = scaleWeights(concepts, evidence);
    expect(scaledConcepts[0].weight).toBeLessThanOrEqual(1.0);
  });

  it('should return the concept with default normalised weight if no related evidence is found', () => {
    // A single concept in its tab with no matching evidence keeps weight unchanged through
    // individual scaling, then per-tab normalisation applies the single-concept default (0.7).
    const concepts: Concept[] = [
      { id: 'concept-1', label: 'Orphan Concept', sourceEvidenceIds: ['non-existent-evidence'], weight: 0.5, tabId: 'engineer' },
    ];
    const evidence: Evidence[] = [
      { id: 'evidence-1', source: 'CV', date: '2023-01-01', text: '', author: '' },
    ];

    const scaledConcepts = scaleWeights(concepts, evidence);
    expect(scaledConcepts[0].weight).toEqual(0.7);
  });

  // --- Per-tab min-max normalisation tests ---

  it('should spread weights to [0.15, 1.0] for a tab with varied-weight concepts', () => {
    const makeEvidence = (id: string): Evidence => ({
      id,
      tabId: 'engineer',
      source: 'CV',
      author: 'Test',
      authorRole: 'Tester',
      date: new Date().toISOString(),
      text: '',
      imageUrl: null,
      externalUrl: null,
      createdAt: new Date().toISOString(),
    });
    const makeConcept = (id: string, label: string, weight: number): Concept => ({
      id,
      label,
      tabId: 'engineer',
      weight,
      confidence: 0.8,
      sourceEvidenceIds: [id + '-ev'],
      createdByLLM: false,
      createdAt: new Date().toISOString(),
    });

    const concepts: Concept[] = [
      makeConcept('c1', 'Skill A', 0.7),
      makeConcept('c2', 'Skill B', 0.75),
      makeConcept('c3', 'Skill C', 0.8),
      makeConcept('c4', 'Skill D', 0.85),
      makeConcept('c5', 'Skill E', 0.9),
    ];
    const evidence: Evidence[] = concepts.map(c => makeEvidence(c.sourceEvidenceIds[0].replace('-ev', '')));

    const scaled = scaleWeights(concepts, evidence);
    const weights = scaled.map(c => c.weight);
    expect(Math.min(...weights)).toBeLessThanOrEqual(0.3);
    expect(Math.max(...weights)).toBeGreaterThanOrEqual(0.85);
  });

  it('should assign weight 0.7 to a tab with a single concept', () => {
    const concept: Concept = {
      id: 'c1',
      label: 'Lone Skill',
      tabId: 'solo-tab',
      weight: 0.5,
      confidence: 0.8,
      sourceEvidenceIds: ['e1'],
      createdByLLM: false,
      createdAt: new Date().toISOString(),
    };
    const evidence: Evidence[] = [
      {
        id: 'e1',
        tabId: 'solo-tab',
        source: 'CV',
        author: 'Test',
        authorRole: 'Tester',
        date: new Date().toISOString(),
        text: '',
        imageUrl: null,
        externalUrl: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const scaled = scaleWeights([concept], evidence);
    expect(scaled[0].weight).toBeCloseTo(0.7, 5);
  });

  it('should assign weight 0.7 to all concepts in a tab where all weights are identical', () => {
    const makeEvidence = (id: string, tabId: string): Evidence => ({
      id,
      tabId,
      source: 'CV',
      author: 'Test',
      authorRole: 'Tester',
      date: new Date().toISOString(),
      text: '',
      imageUrl: null,
      externalUrl: null,
      createdAt: new Date().toISOString(),
    });
    const makeConcept = (id: string, evId: string): Concept => ({
      id,
      label: id,
      tabId: 'uniform-tab',
      weight: 0.6,
      confidence: 0.8,
      sourceEvidenceIds: [evId],
      createdByLLM: false,
      createdAt: new Date().toISOString(),
    });

    const concepts: Concept[] = [
      makeConcept('c1', 'e1'),
      makeConcept('c2', 'e2'),
      makeConcept('c3', 'e3'),
    ];
    const evidence: Evidence[] = [
      makeEvidence('e1', 'uniform-tab'),
      makeEvidence('e2', 'uniform-tab'),
      makeEvidence('e3', 'uniform-tab'),
    ];

    const scaled = scaleWeights(concepts, evidence);
    scaled.forEach(c => expect(c.weight).toBeCloseTo(0.7, 5));
  });

  it('should normalise two single-concept tabs independently, each getting 0.7', () => {
    const makeEvidence = (id: string, tabId: string): Evidence => ({
      id,
      tabId,
      source: 'CV',
      author: 'Test',
      authorRole: 'Tester',
      date: new Date().toISOString(),
      text: '',
      imageUrl: null,
      externalUrl: null,
      createdAt: new Date().toISOString(),
    });

    const concepts: Concept[] = [
      {
        id: 'c1', label: 'Skill A', tabId: 'tab-alpha', weight: 0.3,
        confidence: 0.8, sourceEvidenceIds: ['e1'], createdByLLM: false, createdAt: new Date().toISOString(),
      },
      {
        id: 'c2', label: 'Skill B', tabId: 'tab-beta', weight: 0.9,
        confidence: 0.8, sourceEvidenceIds: ['e2'], createdByLLM: false, createdAt: new Date().toISOString(),
      },
    ];
    const evidence: Evidence[] = [
      makeEvidence('e1', 'tab-alpha'),
      makeEvidence('e2', 'tab-beta'),
    ];

    const scaled = scaleWeights(concepts, evidence);
    const a = scaled.find(c => c.id === 'c1')!;
    const b = scaled.find(c => c.id === 'c2')!;
    expect(a.weight).toBeCloseTo(0.7, 5);
    expect(b.weight).toBeCloseTo(0.7, 5);
  });

  it('should ensure all final weights are at or above the validator minimum of 0.1', () => {
    const makeEvidence = (id: string): Evidence => ({
      id,
      tabId: 'check-tab',
      source: 'Personal Hobby Log',
      author: 'Test',
      authorRole: 'Tester',
      date: '2015-01-01',
      text: '',
      imageUrl: null,
      externalUrl: null,
      createdAt: new Date().toISOString(),
    });
    const makeConcept = (id: string, weight: number): Concept => ({
      id,
      label: id,
      tabId: 'check-tab',
      weight,
      confidence: 0.5,
      sourceEvidenceIds: [id + '-ev'],
      createdByLLM: false,
      createdAt: new Date().toISOString(),
    });

    const concepts: Concept[] = [
      makeConcept('c1', 0.1),
      makeConcept('c2', 0.5),
      makeConcept('c3', 0.9),
    ];
    const evidence: Evidence[] = concepts.map(c => makeEvidence(c.sourceEvidenceIds[0].replace('-ev', '')));

    const scaled = scaleWeights(concepts, evidence);
    scaled.forEach(c => expect(c.weight).toBeGreaterThanOrEqual(0.1));
  });
});
