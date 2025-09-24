import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { getFromCache, saveToCache } from './llmCache.ts';

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
  async generateJson(text: string): Promise<any> {
    const cached = await getFromCache(text);
    if (cached) {
      return cached;
    }

    const systemPrompt = `
      You are a data extraction specialist. Your task is to analyze the following text and extract two types of information: a single "evidence" object and an array of "concept" objects.

      The text provided is a fragment from a CV, a recommendation, or a personal reflection.

      **JSON Schema:**
      Your output MUST be a single, valid JSON object with the following structure:
      {
        "evidence": {
          "id": "string", // MUST be a unique identifier for THIS specific piece of evidence
          "source": "string",
          "text": "string",
          "author": "string"
        },
        "concepts": [
          {
            "id": "string", // MUST be a unique identifier for THIS concept
            "label": "string",
            "tabId": "string", // The ID of the most relevant tab: "personal", "leader", "engineer", or "colleague"
            "weight": "number", // A score from 0.1 to 1.0, representing the importance or relevance
            "sourceEvidenceIds": ["string"]
          }
        ]
      }

      **Instructions:**
      1.  Analyze the provided text **ONLY**. Do not invent concepts or skills that are not explicitly mentioned.
      2.  Generate a **NEW AND UNIQUE** \`id\` for the evidence object and for each concept object.
      3.  Infer the \`source\` from the context of the text (e.g., "CV", "LinkedIn Recommendation").
      4.  The \`author\` must be "Alex Bainbridge" for sources like a CV or personal notes.
      5.  For each concept, determine the most appropriate \`tabId\` from the available options: "personal", "leader", "engineer", "colleague".
      6.  From the text, infer a \`weight\` for each concept between 0.1 and 1.0. Consider factors like recency of an activity, stated interest level, or professional relevance. For example, a hobby done "3 days ago" with "high interest" should have a higher weight than one done "3 months ago" with "medium interest".
      7.  Extract concepts that are **strongly and directly supported** by the text. A vague connection is not sufficient.
      8.  Before finalizing your response, double-check your work. Ensure every concept you extracted has a clear, direct quote or phrase in the source text that justifies its existence.
      9.  You MUST output only the JSON object. Do not include any other text, markdown, or explanations.
    `;

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
