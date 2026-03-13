import { describe, it, expect } from 'vitest';
import { validateProfileData, filterInvalidConcepts, coerceDateToISO, normaliseDates } from '../3_pipeline/validator';
import { Concept, Evidence } from '../../project/lib/types';

describe('Profile Data Validator', () => {
  describe('validateProfileData', () => {
    it('should pass validation for valid data', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Worked with React',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalConcepts).toBe(1);
      expect(result.stats.totalEvidence).toBe(1);
    });
    
    it('should detect concepts with null weights', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: null as any,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Worked with React',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('invalid weight'))).toBe(true);
      expect(result.stats.conceptsWithInvalidWeights).toBe(1);
    });
    
    it('should detect concepts with weights outside valid range', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 1.5, // Invalid: > 1.0
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'concept-2',
          label: 'Python',
          tabId: 'engineer',
          weight: 0.05, // Invalid: < 0.1
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Worked with React and Python',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(false);
      expect(result.stats.conceptsWithInvalidWeights).toBe(2);
    });
    
    it('should detect concepts without evidence', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: [], // No evidence
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('no source evidence IDs'))).toBe(true);
      expect(result.stats.conceptsWithoutEvidence).toBe(1);
    });
    
    it('should detect concepts referencing non-existent evidence', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-nonexistent'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Worked with React',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent evidence ID'))).toBe(true);
    });
    
    it('should detect orphaned evidence', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Worked with React',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'evidence-2',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Orphaned evidence',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(true); // Orphaned evidence is a warning, not an error
      expect(result.warnings.some(w => w.includes('not referenced by any concept'))).toBe(true);
      expect(result.stats.orphanedEvidence).toBe(1);
    });
    
    it('should reject rolled-over dates like 2024-02-30', () => {
      const makeEvidence = (date: string): Evidence[] => [{
        id: 'evidence-1',
        tabId: 'engineer',
        source: 'CV',
        author: 'Alex',
        authorRole: 'Engineer',
        date,
        text: 'Worked with React',
        imageUrl: null,
        externalUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      }];
      const makeConcepts = (): Concept[] => [{
        id: 'concept-1',
        label: 'React',
        tabId: 'engineer',
        weight: 0.8,
        confidence: 0.9,
        sourceEvidenceIds: ['evidence-1'],
        createdByLLM: true,
        createdAt: '2024-01-01T00:00:00Z',
      }];

      expect(validateProfileData(makeConcepts(), makeEvidence('2024-02-30')).stats.invalidDates).toBe(1);
      expect(validateProfileData(makeConcepts(), makeEvidence('2024-04-31')).stats.invalidDates).toBe(1);
      expect(validateProfileData(makeConcepts(), makeEvidence('2024-02-28')).stats.invalidDates).toBe(0);
      expect(validateProfileData(makeConcepts(), makeEvidence('2024-02-29')).stats.invalidDates).toBe(0); // 2024 is a leap year
    });

    it('should detect invalid date formats', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'React',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: 'invalid-date', // Invalid format
          text: 'Worked with React',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const result = validateProfileData(concepts, evidence);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid date format'))).toBe(true);
      expect(result.stats.invalidDates).toBe(1);
    });
  });
  
  describe('filterInvalidConcepts', () => {
    it('should filter out concepts with invalid weights', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'Valid',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'concept-2',
          label: 'Invalid Weight',
          tabId: 'engineer',
          weight: null as any,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Test',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const filtered = filterInvalidConcepts(concepts, evidence);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Valid');
    });
    
    it('should filter out concepts without evidence', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'Valid',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'concept-2',
          label: 'No Evidence',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: [],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Test',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const filtered = filterInvalidConcepts(concepts, evidence);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Valid');
    });
    
    it('should filter out concepts with non-existent evidence IDs', () => {
      const concepts: Concept[] = [
        {
          id: 'concept-1',
          label: 'Valid',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-1'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'concept-2',
          label: 'Invalid Evidence',
          tabId: 'engineer',
          weight: 0.8,
          confidence: 0.9,
          sourceEvidenceIds: ['evidence-nonexistent'],
          createdByLLM: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const evidence: Evidence[] = [
        {
          id: 'evidence-1',
          tabId: 'engineer',
          source: 'CV',
          author: 'Alex',
          authorRole: 'Engineer',
          date: '2024-01-01',
          text: 'Test',
          imageUrl: null,
          externalUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const filtered = filterInvalidConcepts(concepts, evidence);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Valid');
    });
  });
});

describe('coerceDateToISO', () => {
  it('should return the same string for an already-valid ISO 8601 date', () => {
    expect(coerceDateToISO('2025-01-15')).toBe('2025-01-15');
  });
  it('should coerce DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(coerceDateToISO('15/01/2025')).toBe('2025-01-15');
  });
  it('should coerce MM/DD/YYYY to YYYY-MM-DD when day > 12 (unambiguous)', () => {
    expect(coerceDateToISO('01/15/2025')).toBe('2025-01-15');
  });
  it('should prefer DD/MM/YYYY for ambiguous dates like 01/10/2025', () => {
    expect(coerceDateToISO('01/10/2025')).toBe('2025-10-01');
  });
  it('should return null for a truly unparseable date string', () => {
    expect(coerceDateToISO('not-a-date')).toBeNull();
    expect(coerceDateToISO('')).toBeNull();
    expect(coerceDateToISO('32/01/2025')).toBeNull();
  });
});

describe('normaliseDates', () => {
  const baseEvidence = {
    id: 'ev-1', tabId: 'engineer', source: 'CV', author: 'Alex',
    authorRole: '', text: 'worked with React', imageUrl: null,
    externalUrl: null, createdAt: '2025-10-01T00:00:00Z',
  };
  it('should convert DD/MM/YYYY dates in evidence to ISO 8601', () => {
    const result = normaliseDates([{ ...baseEvidence, date: '01/10/2025' }]);
    expect(result[0].date).toBe('2025-10-01');
  });
  it('should leave already-valid ISO dates unchanged', () => {
    const result = normaliseDates([{ ...baseEvidence, date: '2025-10-01' }]);
    expect(result[0].date).toBe('2025-10-01');
  });
  it('should not mutate the original evidence array', () => {
    const evidence = [{ ...baseEvidence, date: '01/10/2025' }];
    normaliseDates(evidence);
    expect(evidence[0].date).toBe('01/10/2025');
  });
});
