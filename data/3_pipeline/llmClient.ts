import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { getFromCache, saveToCache } from './llmCache.ts';
import { getSystemPrompt } from './prompts/systemPrompt.ts';

// Explicitly point to the .env file inside the 'project' directory
dotenv.config({ path: path.resolve(__dirname, '../../project/.env') });

// Only require API key if not in dry-run mode
if (!process.env.LLM_DRY_RUN && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in the environment variables. Set LLM_DRY_RUN=true to run without API calls.');
}

const openai = process.env.LLM_DRY_RUN 
  ? null 
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      dangerouslyAllowBrowser: true,
    });

export const llmClient = {
  async generateJson(text: string, evidenceId: string): Promise<any> {
    if (process.env.LLM_DRY_RUN === 'true') {
      console.log('[DRY RUN] LLM call skipped.');
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      return {
        evidence: { 
          id: evidenceId, 
          source: 'dry-run', 
          text: text, 
          author: 'Dry Run',
          date: currentDate,
          tabId: 'engineer',
          authorRole: '',
          imageUrl: null,
          externalUrl: null,
          createdAt: new Date().toISOString()
        },
        concepts: [],
      };
    }
    
    const cached = await getFromCache(text);
    if (cached) {
      return cached;
    }

    const systemPrompt = getSystemPrompt(evidenceId);

    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized. This should not happen in dry-run mode.');
      }
      
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
