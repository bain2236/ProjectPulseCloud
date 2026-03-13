import { Concept, Evidence } from '../../project/lib/types';

/**
 * Attempts to coerce a date string into YYYY-MM-DD ISO 8601 format.
 * Returns the coerced string, or null if the input cannot be parsed.
 *
 * Handles:
 *   - Already-valid YYYY-MM-DD strings (validated and returned as-is)
 *   - DD/MM/YYYY and MM/DD/YYYY slash-separated formats
 *     - If first part > 12 → must be DD/MM/YYYY
 *     - If second part > 12 → must be MM/DD/YYYY
 *     - Otherwise (ambiguous) → prefer DD/MM/YYYY
 */
export function coerceDateToISO(dateString: string): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Already YYYY-MM-DD?
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoMatch = isoPattern.exec(dateString);
  if (isoMatch) {
    const d = new Date(dateString);
    if (d instanceof Date && !isNaN(d.getTime())) {
      return dateString;
    }
    return null;
  }

  // DD/MM/YYYY or MM/DD/YYYY?
  const slashPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const slashMatch = slashPattern.exec(dateString);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);

    let day: number;
    let month: number;

    if (first > 12) {
      // Must be DD/MM/YYYY
      day = first;
      month = second;
    } else if (second > 12) {
      // Must be MM/DD/YYYY
      month = first;
      day = second;
    } else {
      // Ambiguous — prefer DD/MM/YYYY
      day = first;
      month = second;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = String(year);
    const candidate = `${yyyy}-${mm}-${dd}`;

    // Guard against date rollover (e.g. Feb 31)
    const d = new Date(candidate);
    if (
      d instanceof Date &&
      !isNaN(d.getTime()) &&
      d.getUTCFullYear() === year &&
      d.getUTCMonth() + 1 === month &&
      d.getUTCDate() === day
    ) {
      return candidate;
    }
    return null;
  }

  return null;
}

/**
 * Returns a new evidence array with date fields coerced to ISO 8601 (YYYY-MM-DD).
 * Items whose date cannot be coerced are left unchanged (validation will catch them).
 * Does not mutate the original array.
 */
export function normaliseDates(evidence: Evidence[]): Evidence[] {
  return evidence.map(ev => {
    const coerced = coerceDateToISO(ev.date);
    if (coerced === null || coerced === ev.date) {
      return ev;
    }
    return { ...ev, date: coerced };
  });
}

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

    // Check highlights field if present
    const evWithHighlights = ev as Evidence & { highlights?: unknown };
    if ('highlights' in evWithHighlights && evWithHighlights.highlights !== undefined) {
      const highlights = evWithHighlights.highlights;
      if (
        !Array.isArray(highlights) ||
        highlights.some((h: unknown) => typeof h !== 'string' || h.trim() === '')
      ) {
        errors.push(
          `Evidence "${ev.id}" has an invalid highlights field. Must be a string[] with no empty strings.`
        );
      }
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
