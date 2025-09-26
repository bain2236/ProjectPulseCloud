export function assembleFinalJson(baseProfile: any, tabs: any[], settings: any, processedData: any[]): any {
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
    } else if (existingIdKey && conceptMap.has(existingIdKey)) {
      // Merge into existing concept found by ID
      const existing = conceptMap.get(existingIdKey);
      existing.sourceEvidenceIds.push(...concept.sourceEvidenceIds);
    } else {
      // Add as a new concept
      const newConcept = { ...concept, sourceEvidenceIds: [...concept.sourceEvidenceIds] };
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
  };
}
