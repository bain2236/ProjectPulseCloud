import { describe, it, expect, vi, afterAll } from 'vitest';

// vi.hoisted runs before imports, so this sets the env before llmClient's
// module-load guard executes.
const { cleanup } = vi.hoisted(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  return {
    cleanup: () => {
      delete process.env.OPENAI_API_KEY;
    },
  };
});

afterAll(() => { cleanup(); });

import { llmClient } from '../3_pipeline/llmClient';

describe('LLM Client', () => {
  it('should return a dry run response when LLM_DRY_RUN is true', async () => {
    process.env.LLM_DRY_RUN = 'true';

    try {
      const result = await llmClient.generateJson('some text', 'evidence-1');

      expect(result).toMatchObject({
        evidence: { id: 'evidence-1', source: 'dry-run', text: 'some text', author: 'Dry Run' },
        concepts: [],
      });
    } finally {
      delete process.env.LLM_DRY_RUN;
    }
  });
});
