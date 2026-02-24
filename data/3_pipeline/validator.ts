import { Concept, Evidence } from '../../project/lib/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalConcepts: number;
    totalEvidence: number;
    conceptsWithInvalidWeights: number;
    conceptsWithoutEvidence: number;
    orphanedEvidence: number;
    invalidDates: number;
  };
}

/**
 * Validates that a weight is within the valid range (0.1 to 1.0) and not null/undefined
 */
function isValidWeight(weight: any): boolean {
  return (
    weight !== null &&
    weight !== undefined &&
    typeof weight === 'number' &&
    !isNaN(weight) &&
    weight >= 0.1 &&
    weight <= 1.0
  );
}

/**
 * Validates that a date string is in YYYY-MM-DD format
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validates the complete profile data structure
 */
export function validateProfileData(concepts: Concept[], evidence: Evidence[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const evidenceIds = new Set(evidence.map(e => e.id));
  let conceptsWithInvalidWeights = 0;
  let conceptsWithoutEvidence = 0;
  let invalidDates = 0;
  
  // Validate concepts
  for (const concept of concepts) {
    // Check weight
    if (!isValidWeight(concept.weight)) {
      conceptsWithInvalidWeights++;
      errors.push(
        `Concept "${concept.label}" (${concept.id}) has invalid weight: ${concept.weight}. Must be between 0.1 and 1.0.`
      );
    }
    
    // Check evidence IDs
    if (!concept.sourceEvidenceIds || concept.sourceEvidenceIds.length === 0) {
      conceptsWithoutEvidence++;
      errors.push(
        `Concept "${concept.label}" (${concept.id}) has no source evidence IDs.`
      );
    } else {
      // Check that all evidence IDs reference existing evidence
      for (const evidenceId of concept.sourceEvidenceIds) {
        if (!evidenceIds.has(evidenceId)) {
          errors.push(
            `Concept "${concept.label}" (${concept.id}) references non-existent evidence ID: ${evidenceId}`
          );
        }
      }
    }
  }
  
  // Validate evidence
  const conceptEvidenceIds = new Set(
    concepts.flatMap(c => c.sourceEvidenceIds || [])
  );
  
  let orphanedEvidence = 0;
  for (const ev of evidence) {
    // Check for orphaned evidence (not referenced by any concept)
    if (!conceptEvidenceIds.has(ev.id)) {
      orphanedEvidence++;
      warnings.push(
        `Evidence "${ev.id}" (from ${ev.source}) is not referenced by any concept.`
      );
    }
    
    // Check date format
    if (!isValidDate(ev.date)) {
      invalidDates++;
      errors.push(
        `Evidence "${ev.id}" has invalid date format: "${ev.date}". Expected YYYY-MM-DD format.`
      );
    }
  }
  
  // Generate statistics
  const stats = {
    totalConcepts: concepts.length,
    totalEvidence: evidence.length,
    conceptsWithInvalidWeights,
    conceptsWithoutEvidence,
    orphanedEvidence,
    invalidDates,
  };
  
  // Log summary
  if (errors.length > 0 || warnings.length > 0) {
    console.log('\n=== Validation Results ===');
    console.log(`Total concepts: ${stats.totalConcepts}`);
    console.log(`Total evidence: ${stats.totalEvidence}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => console.error(`  ❌ ${err}`));
    }
    
    if (warnings.length > 0) {
      console.log('\nWarnings:');
      warnings.forEach(warn => console.warn(`  ⚠️  ${warn}`));
    }
    console.log('========================\n');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

/**
 * Filters out invalid concepts from the array
 */
export function filterInvalidConcepts(concepts: Concept[], evidence: Evidence[]): Concept[] {
  const evidenceIds = new Set(evidence.map(e => e.id));
  
  return concepts.filter(concept => {
    // Keep only concepts with valid weights
    if (!isValidWeight(concept.weight)) {
      return false;
    }
    
    // Keep only concepts with at least one evidence ID
    if (!concept.sourceEvidenceIds || concept.sourceEvidenceIds.length === 0) {
      return false;
    }
    
    // Keep only concepts where all evidence IDs exist
    const allEvidenceExists = concept.sourceEvidenceIds.every(id => evidenceIds.has(id));
    if (!allEvidenceExists) {
      return false;
    }
    
    return true;
  });
}
