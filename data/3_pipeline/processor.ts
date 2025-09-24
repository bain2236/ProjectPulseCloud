import { llmClient } from './llmClient.ts';

export async function processRawText(rawText: string, sourcePath: string): Promise<any> {
  // In the future, we can use sourcePath to provide more context to the LLM
  const llmResult = await llmClient.generateJson(rawText);
  return llmResult;
}
