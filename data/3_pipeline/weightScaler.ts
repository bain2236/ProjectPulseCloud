import { Concept, Evidence } from '../../project/lib/types';

const SOURCE_AUTHORITY_MAP: Record<string, number> = {
  'CV': 1.2,
  'LinkedIn Recommendation': 1.1,
  'Wins': 1.0,
  'Personal Hobby Log': 0.9,
  'default': 1.0,
};

const EVIDENCE_COUNT_BONUS = 0.05; // 5% bonus per additional piece of evidence
const RECENCY_DECAY_RATE = 0.05; // 5% decay per year

const DEFAULT_WEIGHT = 0.5;

export function scaleWeights(concepts: Concept[], evidence: Evidence[]): Concept[] {
  const evidenceMap = new Map(evidence.map(e => [e.id, e]));

  return concepts.map(concept => {
    // Handle null/undefined weights - use default and log warning
    if (concept.weight === null || concept.weight === undefined || isNaN(concept.weight)) {
      console.warn(`Concept "${concept.label}" (${concept.id}) has invalid weight (${concept.weight}), using default ${DEFAULT_WEIGHT}`);
      concept = { ...concept, weight: DEFAULT_WEIGHT };
    }
    
    let scaledWeight = concept.weight;

    const relatedEvidence = concept.sourceEvidenceIds
      .map(id => evidenceMap.get(id))
      .filter((e): e is Evidence => e !== undefined);

    if (relatedEvidence.length === 0) {
      return concept;
    }

    // 1. Evidence Count Bonus
    if (relatedEvidence.length > 1) {
      scaledWeight += (relatedEvidence.length - 1) * EVIDENCE_COUNT_BONUS;
    }

    // Calculate average source authority and recency from all related evidence
    const totalAuthority = relatedEvidence.reduce((sum, e) => {
      const authority = SOURCE_AUTHORITY_MAP[e.source] || SOURCE_AUTHORITY_MAP.default;
      return sum + authority;
    }, 0);
    const avgAuthority = totalAuthority / relatedEvidence.length;

    const totalRecencyEffect = relatedEvidence.reduce((sum, e) => {
      // Handle invalid or missing dates gracefully
      if (!e.date) {
        return sum + 1.0; // Default to no decay if date is missing
      }
      
      try {
        const evidenceYear = new Date(e.date).getFullYear();
        if (isNaN(evidenceYear)) {
          return sum + 1.0; // Default to no decay if date is invalid
        }
        const currentYear = new Date().getFullYear();
        const yearsOld = Math.max(0, currentYear - evidenceYear);
        const decay = 1 - (yearsOld * RECENCY_DECAY_RATE);
        return sum + Math.max(0, decay); // Ensure decay doesn't go below 0
      } catch (error) {
        console.warn(`Invalid date for evidence ${e.id}: ${e.date}, using default recency`);
        return sum + 1.0; // Default to no decay on error
      }
    }, 0);
    const avgRecencyEffect = totalRecencyEffect / relatedEvidence.length;

    // 2. Apply Source Authority and 3. Recency Decay
    scaledWeight *= avgAuthority * avgRecencyEffect;

    // 4. Cap the final weight at 1.0
    const finalWeight = Math.min(1.0, scaledWeight);

    return {
      ...concept,
      weight: finalWeight,
    };
  });
}
