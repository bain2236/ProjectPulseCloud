import { readAllFiles } from './fileReader.ts';
import { processRawText } from './processor.ts';
import { assembleFinalJson } from './assembler.ts';
import { extractKeywords } from './keywordExtractor.ts';
import { chunkFile } from './chunker.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

// 
// This script will be responsible for the following:
// 1. Reading all raw data files from the `../1_raw` directory.
// 2. Calling an LLM to process the text and extract structured data (evidence and concepts).
// 3. Assembling the final `profile.json` file.
// 4. Saving the processed JSON files to the `../2_processed` directory.
// 5. Saving the final `profile.json` to the `../../project/public` directory for the app to use.
//

export async function main() {
  console.log("Data processing pipeline starting...");

  const rawDataPath = path.join(__dirname, '..', '1_raw');
  const baseProfilePath = path.join(__dirname, '..', 'base-profile.json');
  const outputPath = path.join(__dirname, '..', '..', 'project', 'public', 'profile.json');

  const keywordsContent = await fs.readFile(path.join(__dirname, '..', 'keywords.json'), 'utf-8');
  const keywords = JSON.parse(keywordsContent);
  
  const baseProfileContent = await fs.readFile(baseProfilePath, 'utf-8');
  const baseProfileData = JSON.parse(baseProfileContent);
  const { profile, tabs, settings } = baseProfileData;

  const rawFiles = await readAllFiles(rawDataPath);
  
  const chunksToProcess = rawFiles.flatMap(file => chunkFile(file));

  const processedData = [];
  for (const chunk of chunksToProcess) {
    console.log(`Processing chunk from ${chunk.path}...`);
    
    // Get concepts from both sources
    const keywordConcepts = extractKeywords(chunk.content, keywords);
    const llmResult = await processRawText(chunk.content, chunk.path);

    // Combine and add evidence ID to keyword concepts
    if (llmResult && llmResult.evidence.id) {
      keywordConcepts.forEach(c => c.sourceEvidenceIds.push(llmResult.evidence.id));
      const combinedConcepts = [...keywordConcepts, ...llmResult.concepts];
      
      processedData.push({
        evidence: llmResult.evidence,
        concepts: combinedConcepts,
      });
    } else if (llmResult) {
      processedData.push(llmResult);
    }
  }

  const finalJson = assembleFinalJson(profile, tabs, settings, processedData);

  await fs.writeFile(outputPath, JSON.stringify(finalJson, null, 2));

  console.log(`Data processing pipeline finished. Profile written to ${outputPath}`);
}

// Allow the script to be run directly from the command line
if (require.main === module) {
  main();
}
