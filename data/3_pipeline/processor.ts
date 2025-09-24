import { llmClient } from './llmClient.ts';
import { v4 as uuidv4 } from 'uuid';

export async function processRawText(rawText: string, sourcePath: string): Promise<any> {
  const evidenceId = `evidence-${uuidv4()}`;
  const llmResult = await llmClient.generateJson(rawText, evidenceId);
  
  if (!llmResult || !llmResult.evidence) {
    return null;
  }

  // Create a new object to avoid mutation issues and guarantee our ID is used.
  const finalResult = {
    ...llmResult,
    evidence: {
      ...llmResult.evidence,
      id: evidenceId,
    },
  };
  
  return finalResult;
}
