import { describe, it, expect } from 'vitest';
import { validateProfileData, filterInvalidConcepts } from '../3_pipeline/validator';
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
