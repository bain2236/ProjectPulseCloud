/**
 * Merges weights from two concepts, preferring non-null values.
 * If both have weights, uses the maximum. If both are null, returns default (0.5).
 */
function mergeWeights(existingWeight: number | null | undefined, newWeight: number | null | undefined): number {
  const DEFAULT_WEIGHT = 0.5;
  
  // If both are null/undefined, use default
  if ((existingWeight === null || existingWeight === undefined) && (newWeight === null || newWeight === undefined)) {
    return DEFAULT_WEIGHT;
  }
  
  // If one is null/undefined, use the other
  if (existingWeight === null || existingWeight === undefined) {
    return newWeight ?? DEFAULT_WEIGHT;
  }
  if (newWeight === null || newWeight === undefined) {
    return existingWeight;
  }
  
  // Both have values, use the maximum (prefer higher confidence)
  return Math.max(existingWeight, newWeight);
}

export function assembleFinalJson(baseProfile: any, tabs: any[], settings: any, processedData: any[], aboutMeContent: string): any {
  const allEvidence = processedData.map(data => data.evidence);
  const allConcepts = processedData.flatMap(data => data.concepts);

  const conceptMap = new Map<string, any>();
  const idMap = new Map<string, string>(); // To track which key an ID maps to

  for (const concept of allConcepts) {
    const key = concept.label.toLowerCase().trim();
    const existingIdKey = idMap.get(concept.id);

    if (conceptMap.has(key)) {
      // Merge into existing concept found by label
      const existing = conceptMap.get(key);
      existing.sourceEvidenceIds.push(...concept.sourceEvidenceIds);
      // Merge weights properly
      existing.weight = mergeWeights(existing.weight, concept.weight);
    } else if (existingIdKey && conceptMap.has(existingIdKey)) {
      // Merge into existing concept found by ID
      const existing = conceptMap.get(existingIdKey);
      existing.sourceEvidenceIds.push(...concept.sourceEvidenceIds);
      // Merge weights properly
      existing.weight = mergeWeights(existing.weight, concept.weight);
    } else {
      // Add as a new concept
      const newConcept = { 
        ...concept, 
        sourceEvidenceIds: [...concept.sourceEvidenceIds],
        // Ensure weight is never null
        weight: concept.weight ?? 0.5
      };
      conceptMap.set(key, newConcept);
      idMap.set(concept.id, key); // Map the ID to the label key
    }
  }

  const finalConcepts = Array.from(conceptMap.values()).filter(
    (concept) => concept.sourceEvidenceIds && concept.sourceEvidenceIds.length > 0
  );

  return {
    profile: baseProfile,
    tabs: tabs,
    settings: settings,
    evidence: allEvidence,
    concepts: finalConcepts,
    aboutMe: aboutMeContent,
  };
}
