import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { getFromCache, saveToCache } from './llmCache.ts';
import { getSystemPrompt } from './prompts/systemPrompt.ts';

// Explicitly point to the .env file inside the 'project' directory
dotenv.config({ path: path.resolve(__dirname, '../../project/.env') });


if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in the environment variables.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const llmClient = {
  async generateJson(text: string, evidenceId: string): Promise<any> {
    if (process.env.LLM_DRY_RUN === 'true') {
      console.log('[DRY RUN] LLM call skipped.');
      return {
        evidence: { id: evidenceId, source: 'dry-run', text: text, author: 'Dry Run' },
        concepts: [],
      };
    }
    
    const cached = await getFromCache(text);
    if (cached) {
      return cached;
    }

    const systemPrompt = getSystemPrompt(evidenceId);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const jsonContent = response.choices[0].message.content;
      if (!jsonContent) {
        throw new Error('LLM returned empty content.');
      }

      const parsedJson = JSON.parse(jsonContent);
      await saveToCache(text, parsedJson);
      return parsedJson;

    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error("Failed to generate JSON from LLM.");
    }
  }
};
