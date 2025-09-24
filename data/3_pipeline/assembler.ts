export function assembleFinalJson(baseProfile: any, tabs: any[], settings: any, processedData: any[]): any {
  const allEvidence = processedData.map(data => data.evidence);
  const allConcepts = processedData.flatMap(data => data.concepts);

  const conceptMap = new Map<string, any>();

  for (const concept of allConcepts) {
    if (conceptMap.has(concept.id)) {
      const existing = conceptMap.get(concept.id);
      existing.sourceEvidenceIds.push(...concept.sourceEvidenceIds);
    } else {
      // Create a copy to avoid mutating the original test data
      conceptMap.set(concept.id, { ...concept, sourceEvidenceIds: [...concept.sourceEvidenceIds] });
    }
  }

  return {
    profile: baseProfile,
    tabs: tabs,
    settings: settings,
    evidence: allEvidence,
    concepts: Array.from(conceptMap.values()),
  };
}
