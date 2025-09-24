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
        concepts: [{ id: 'concept-1', label: 'leadership', sourceEvidenceIds: ['evidence-1'] }],
      },
      {
        evidence: { id: 'evidence-2', text: 'Evidence text 2' },
        concepts: [{ id: 'concept-2', label: 'collaboration', sourceEvidenceIds: ['evidence-2'] }],
      },
      {
        evidence: { id: 'evidence-3', text: 'Evidence text 3' },
        concepts: [
          { id: 'concept-1', label: 'leadership', sourceEvidenceIds: ['evidence-3'] },
          { id: 'concept-3', label: 'communication', sourceEvidenceIds: ['evidence-3'] },
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
    expect(finalJson.concepts).toContainEqual({
      id: 'concept-1',
      label: 'leadership',
      sourceEvidenceIds: ['evidence-1', 'evidence-3'],
    });
    expect(finalJson.concepts).toContainEqual({
      id: 'concept-2',
      label: 'collaboration',
      sourceEvidenceIds: ['evidence-2'],
    });
    expect(finalJson.settings).toEqual(settings);
  });
});
