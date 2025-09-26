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

    const systemPrompt = `You are a meticulous data analyst. Your task is to extract structured data from a given text fragment.
The text could be from a CV, a recommendation, a personal note, or a hobby log.
Your output MUST be a single, valid JSON object and nothing else. Adhere strictly to the schema and instructions.

**JSON Output Schema:**
{
  "evidence": {
    "id": "${evidenceId}", // MUST be this exact value. Do not change it.
    "source": "string", // e.g., "CV", "LinkedIn Recommendation", "Personal Hobby Log"
    "text": "string", // The original text fragment.
    "author": "string" // The author of the text. For personal notes or a CV, this is "Alex Bainbridge".
  },
  "concepts": [
    {
      "id": "string", // A unique, URL-friendly slug for the concept. e.g., "concept-react-testing-library".
      "label": "string", // A concise, display-friendly label for the concept. e.g., "React Testing Library".
      "tabId": "string", // Classify into ONE of: "engineer" (tech skills), "leader" (soft skills), "personal" (hobbies), "colleague" (teamwork).
      "weight": "number", // A score from 0.1 to 1.0 based on the text's emphasis.
      "sourceEvidenceIds": ["${evidenceId}"] // MUST be an array containing the exact evidence ID from above.
    }
  ]
}

**Detailed Instructions:**

1.  **Evidence ID**: You MUST use the provided ID for \`evidence.id\`: \`"${evidenceId}"\`.
2.  **Concept ID**: Generate a NEW, UNIQUE, and URL-friendly slug for each concept's \`id\`.
3.  **Tab Classification (\`tabId\`):**
    -   \`engineer\`: For specific technologies, programming languages, or technical skills.
    -   \`leader\`: For management, mentorship, and soft skills.
    -   \`colleague\`: For collaboration and teamwork-focused skills.
    -   \`personal\`: For hobbies and personal interests.
4.  **Weighting (\`weight\`):**
    -   **0.8 - 1.0**: Explicit claims of expertise, deep involvement, or high passion.
    -   **0.5 - 0.7**: Significant mentions, project roles, or regular practice.
    -   **0.1 - 0.4**: Passing mentions, familiarity, or low-frequency activities.
5.  **Guiding Principles:**
    -   **No Fabrication**: Extract ONLY concepts explicitly mentioned in the text. Do not infer or add related skills.
    -   **Direct Evidence**: Every concept must be directly supported by the provided text.
    -   **Specificity**: Avoid generic concepts like "Team Player" unless the text uses those exact words. Extract specific skills like "Agile Methodologies" or "Pair Programming".

**Example:**

INPUT TEXT:
"Alex is a great engineer to work with. He introduced the team to Test-Driven Development (TDD) and greatly improved our CI/CD pipeline using GitHub Actions."

EXPECTED JSON OUTPUT:
{
  "evidence": {
    "id": "${evidenceId}",
    "source": "LinkedIn Recommendation",
    "text": "Alex is a great engineer to work with. He introduced the team to Test-Driven Development (TDD) and greatly improved our CI/CD pipeline using GitHub Actions.",
    "author": "Anonymous"
  },
  "concepts": [
    {
      "id": "concept-test-driven-development",
      "label": "Test-Driven Development",
      "tabId": "engineer",
      "weight": 0.9,
      "sourceEvidenceIds": ["${evidenceId}"]
    },
    {
      "id": "concept-github-actions",
      "label": "GitHub Actions",
      "tabId": "engineer",
      "weight": 0.8,
      "sourceEvidenceIds": ["${evidenceId}"]
    }
  ]
}

**Final Review:**
Before you output the JSON, review your work. Does it match the schema? Have you followed all instructions? Is every concept directly supported by the text? Now, process the following user-provided text.`;

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
