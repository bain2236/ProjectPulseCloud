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
    const concepts: Concept[] = [
      { id: 'concept-cv', label: 'React', sourceEvidenceIds: ['evidence-cv'], weight: 0.6, tabId: 'engineer' },
      { id: 'concept-hobby', label: 'Painting', sourceEvidenceIds: ['evidence-hobby'], weight: 0.6, tabId: 'personal' },
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

});
