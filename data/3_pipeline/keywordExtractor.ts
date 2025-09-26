import { v4 as uuidv4 } from 'uuid';

interface Keywords {
  technical: string[];
  soft: string[];
}

interface Concept {
  id: string;
  label: string;
  tabId: 'engineer' | 'leader' | 'personal' | 'colleague';
  weight: number;
  sourceEvidenceIds: string[];
}

// Function to create a slug from a label
const toSlug = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

export function extractKeywords(text: string, keywords: Keywords): Concept[] {
  const foundConcepts: Concept[] = [];
  const combinedKeywords = [
    ...keywords.technical.map(k => ({ label: k, tabId: 'engineer' as const })),
    ...keywords.soft.map(k => ({ label: k, tabId: 'leader' as const })) // Default soft skills to leader
  ];

  for (const keyword of combinedKeywords) {
    // Use regex with word boundaries (\b) for whole-word, case-insensitive matching
    const regex = new RegExp(`\\b${keyword.label}\\b`, 'gi');
    if (regex.test(text)) {
      foundConcepts.push({
        id: `concept-${toSlug(keyword.label)}-${uuidv4()}`,
        label: keyword.label,
        tabId: keyword.tabId,
        weight: 0.85, // Add a default high weight for keywords
        sourceEvidenceIds: [],
      });
    }
  }

  return foundConcepts;
}
