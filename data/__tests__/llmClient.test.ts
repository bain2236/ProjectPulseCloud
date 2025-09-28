import { describe, it, expect, beforeEach } from 'vitest';
import { llmClient } from '../3_pipeline/llmClient';

describe('LLM Client', () => {
  beforeEach(() => {
    delete process.env.LLM_DRY_RUN;
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('should return a dry run response when LLM_DRY_RUN is true', async () => {
    process.env.LLM_DRY_RUN = 'true';

    const result = await llmClient.generateJson('some text', 'evidence-1');

    expect(result).toEqual({
      evidence: { id: 'evidence-1', source: 'dry-run', text: 'some text', author: 'Dry Run' },
      concepts: [],
    });
  });
});
