import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

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
    const systemPrompt = `
      You are a data extraction specialist. Your task is to analyze the following text and extract two types of information: a single "evidence" object and an array of "concept" objects.

      The text provided is a fragment from a CV, a recommendation, or a personal reflection.

      **JSON Schema:**
      Your output MUST be a single, valid JSON object with the following structure:
      {
        "evidence": {
          "id": "string",
          "source": "string",
          "text": "string",
          "author": "string"
        },
        "concepts": [
          {
            "id": "string",
            "label": "string",
            "sourceEvidenceIds": ["string"]
          }
        ]
      }

      **Instructions:**
      1.  Generate a unique \`id\` for both the evidence and each concept...
      2.  Infer the \`source\` from the context of the text (e.g., "CV", "LinkedIn Recommendation", "Personal Reflection").
      3.  The \`author\` should be extracted if it is a recommendation. If no author is found, or for sources like a CV or personal notes, the author MUST be "Alex Bainbridge".
      4.  The \`text\` in the evidence object MUST be the original, unmodified text.
      5.  Extract between 1 and 5 key concepts from the text.
      6.  The \`sourceEvidenceIds\` array for each concept must contain the \`id\` of the single evidence object you created.
      7.  You MUST output only the JSON object...
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
      return JSON.parse(jsonContent);

    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error("Failed to generate JSON from LLM.");
    }
  }
};
