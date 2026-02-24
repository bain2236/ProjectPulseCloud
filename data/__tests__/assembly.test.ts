import { describe, it, expect } from 'vitest';
import { assembleFinalJson } from '../../data/3_pipeline/assembler';

describe('JSON Assembly Utility', () => {
  it('should combine profile, tabs, evidence, and concepts into a final JSON object', () => {
    const baseProfile = {
      displayName: "Alex Bainbridge",
      bio: "Full-stack engineer.",
    };

    const tabs = [
      { id: 'personal', title: 'Personal' },
      { id: 'leader', title: 'Leader' },
    ];

    const processedData = [
      {
        evidence: { id: 'evidence-1', text: 'Evidence text 1' },
        concepts: [{ id: 'concept-1', label: 'leadership', weight: 0.7, sourceEvidenceIds: ['evidence-1'] }],
      },
      {
        evidence: { id: 'evidence-2', text: 'Evidence text 2' },
        concepts: [{ id: 'concept-2', label: 'collaboration', weight: 0.8, sourceEvidenceIds: ['evidence-2'] }],
      },
      {
        evidence: { id: 'evidence-3', text: 'Evidence text 3' },
        concepts: [
          { id: 'concept-1', label: 'leadership', weight: 0.9, sourceEvidenceIds: ['evidence-3'] },
          { id: 'concept-3', label: 'communication', weight: 0.6, sourceEvidenceIds: ['evidence-3'] },
        ],
      }
    ];

    const settings = { recencyDecayDays: 365 };

    const finalJson = assembleFinalJson(baseProfile, tabs, settings, processedData);

    // Check that all parts are present
    expect(finalJson.profile).toEqual(baseProfile);
    expect(finalJson.tabs).toEqual(tabs);
    expect(finalJson.evidence).toHaveLength(3);
    
    // Check that concepts are correctly aggregated and duplicates are merged
    expect(finalJson.concepts).toHaveLength(3);
    const leadershipConcept = finalJson.concepts.find((c: any) => c.label === 'leadership');
    expect(leadershipConcept).toBeDefined();
    expect(leadershipConcept.sourceEvidenceIds).toEqual(['evidence-1', 'evidence-3']);
    // Weight should be max of merged weights (0.7 and 0.9 = 0.9)
    expect(leadershipConcept.weight).toBe(0.9);
    expect(finalJson.concepts).toContainEqual({
      id: 'concept-2',
      label: 'collaboration',
      sourceEvidenceIds: ['evidence-2'],
    });
    expect(finalJson.settings).toEqual(settings);
  });

  it('should filter out concepts that have no source evidence', () => {
    const baseProfile = { displayName: "Test User" };
    const tabs: any[] = [];
    const settings = {};
    const processedData = [
      {
        evidence: { id: 'evidence-1', text: 'Valid evidence' },
        concepts: [
          { id: 'concept-1', label: 'Valid Concept', weight: 0.8, sourceEvidenceIds: ['evidence-1'] },
          { id: 'concept-2', label: 'Invalid Concept', weight: 0.7, sourceEvidenceIds: [] }
        ]
      }
    ];

    const finalJson = assembleFinalJson(baseProfile, tabs, settings, processedData);

    expect(finalJson.concepts).toHaveLength(1);
    expect(finalJson.concepts).not.toContainEqual(
      expect.objectContaining({ label: 'Invalid Concept' })
    );
  });

  it('should merge concepts by ID even if labels are different', () => {
    const baseProfile = { displayName: "Test User" };
    const tabs: any[] = [];
    const settings = {};
    const processedData = [
      {
        evidence: { id: 'evidence-1', text: 'Evidence 1' },
        concepts: [{ id: 'concept-1', label: 'Test Concept', weight: 0.7, sourceEvidenceIds: ['evidence-1'] }]
      },
      {
        evidence: { id: 'evidence-2', text: 'Evidence 2' },
        concepts: [{ id: 'concept-1', label: 'Different Label', weight: 0.8, sourceEvidenceIds: ['evidence-2'] }]
      }
    ];

    const finalJson = assembleFinalJson(baseProfile, tabs, settings, processedData);

    expect(finalJson.concepts).toHaveLength(1);
    expect(finalJson.concepts[0].sourceEvidenceIds).toHaveLength(2);
    expect(finalJson.concepts[0].sourceEvidenceIds).toContain('evidence-1');
    expect(finalJson.concepts[0].sourceEvidenceIds).toContain('evidence-2');
  });
  
  it('should properly merge weights when combining concepts', () => {
    const baseProfile = { displayName: "Test User" };
    const tabs: any[] = [];
    const settings = {};
    const processedData = [
      {
        evidence: { id: 'evidence-1', text: 'Evidence 1' },
        concepts: [{ id: 'concept-1', label: 'Python', weight: 0.85, sourceEvidenceIds: ['evidence-1'] }]
      },
      {
        evidence: { id: 'evidence-2', text: 'Evidence 2' },
        concepts: [{ id: 'concept-1', label: 'Python', weight: null as any, sourceEvidenceIds: ['evidence-2'] }]
      },
      {
        evidence: { id: 'evidence-3', text: 'Evidence 3' },
        concepts: [{ id: 'concept-1', label: 'Python', weight: 0.7, sourceEvidenceIds: ['evidence-3'] }]
      }
    ];

    const finalJson = assembleFinalJson(baseProfile, tabs, settings, processedData);

    expect(finalJson.concepts).toHaveLength(1);
    // Should use max weight (0.85) when merging, ignoring null
    expect(finalJson.concepts[0].weight).toBe(0.85);
    expect(finalJson.concepts[0].sourceEvidenceIds).toHaveLength(3);
  });
  
  it('should use default weight when all merged concepts have null weights', () => {
    const baseProfile = { displayName: "Test User" };
    const tabs: any[] = [];
    const settings = {};
    const processedData = [
      {
        evidence: { id: 'evidence-1', text: 'Evidence 1' },
        concepts: [{ id: 'concept-1', label: 'TypeScript', weight: null as any, sourceEvidenceIds: ['evidence-1'] }]
      },
      {
        evidence: { id: 'evidence-2', text: 'Evidence 2' },
        concepts: [{ id: 'concept-1', label: 'TypeScript', weight: null as any, sourceEvidenceIds: ['evidence-2'] }]
      }
    ];

    const finalJson = assembleFinalJson(baseProfile, tabs, settings, processedData);

    expect(finalJson.concepts).toHaveLength(1);
    // Should use default weight (0.5) when all are null
    expect(finalJson.concepts[0].weight).toBe(0.5);
  });
});
