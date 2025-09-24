import { describe, it, expect, vi } from 'vitest';
import { processRawText } from '../../data/3_pipeline/processor';
import { llmClient } from '../../data/3_pipeline/llmClient';

// Mock the LLM client
vi.mock('../../data/3_pipeline/llmClient', () => ({
  llmClient: {
    generateJson: vi.fn(),
  },
}));

describe('Data Processing Utility', () => {
  it('should process raw text and return structured data based on LLM output', async () => {
    const rawText = "Alex is a great collaborator and shows strong leadership.";
    const sourcePath = "data/1_raw/recommendations/test.txt";

    const mockLlmResponse = {
      evidence: {
        id: 'evidence-llm-123',
        source: 'recommendation',
        text: rawText,
        author: 'LLM-Generated',
      },
      concepts: [
        { id: 'concept-llm-456', label: 'collaboration', sourceEvidenceIds: ['evidence-llm-123'] },
        { id: 'concept-llm-789', label: 'leadership', sourceEvidenceIds: ['evidence-llm-123'] },
      ],
    };

    // Configure the mock to return the predefined response
    (llmClient.generateJson as vi.Mock).mockResolvedValue(mockLlmResponse);

    const result = await processRawText(rawText, sourcePath);

    // Assert that the processor function returns the data as expected
    expect(result).toEqual(mockLlmResponse);
    
    // Assert that the LLM client was called correctly
    expect(llmClient.generateJson).toHaveBeenCalledWith(rawText);
  });
});
