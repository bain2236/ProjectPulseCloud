import { readAllFiles } from './fileReader.ts';
import { processRawText } from './processor.ts';
import { assembleFinalJson } from './assembler.ts';
import { extractKeywords } from './keywordExtractor.ts';
import { chunkFile } from './chunker.ts';
import { scaleWeights } from './weightScaler.ts';
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
  const aboutMePath = path.join(rawDataPath, 'personal', 'aboutme.md');
  const baseProfilePath = path.join(__dirname, '..', 'base-profile.json');
  const outputPath = path.join(__dirname, '..', '..', 'project', 'public', 'profile.json');

  const keywordsContent = await fs.readFile(path.join(__dirname, '..', 'keywords.json'), 'utf-8');
  const keywords = JSON.parse(keywordsContent);
  
  const baseProfileContent = await fs.readFile(baseProfilePath, 'utf-8');
  const baseProfileData = JSON.parse(baseProfileContent);
  const { profile, tabs, settings } = baseProfileData;

  const aboutMeContent = await fs.readFile(aboutMePath, 'utf-8');

  const allRawFiles = await readAllFiles(rawDataPath);
  
  // Exclude config and content files from the evidence processing list
  const evidenceFiles = allRawFiles.filter(file => {
    const fileName = path.basename(file.path);
    return fileName !== 'aboutme.md' && fileName !== 'keywords.json' && fileName !== 'base-profile.json';
  });
  
  const chunksToProcess = evidenceFiles.flatMap(file => chunkFile(file));

  const processedData = [];
  for (const chunk of chunksToProcess) {
    console.log(`Processing chunk from ${chunk.path}...`);
    
    // Get concepts from both sources
    const keywordConcepts = extractKeywords(chunk.content, keywords);
    const llmResult = await processRawText(chunk.content, chunk.path);

    if (llmResult) {
      // Always add the evidence from the LLM result
      const evidenceId = llmResult.evidence.id;
      
      // Add the evidenceId to all keyword concepts found in this chunk
      keywordConcepts.forEach(c => c.sourceEvidenceIds.push(evidenceId));

      // Combine the concepts from the LLM with the concepts from the keyword extractor
      const combinedConcepts = [...(llmResult.concepts || []), ...keywordConcepts];
      
      processedData.push({
        evidence: llmResult.evidence,
        concepts: combinedConcepts,
      });
    }
  }

  const assembledJson = assembleFinalJson(profile, tabs, settings, processedData, aboutMeContent);

  // Post-process the weights
  const scaledConcepts = scaleWeights(assembledJson.concepts, assembledJson.evidence);

  const finalJsonWithScaledWeights = {
    ...assembledJson,
    concepts: scaledConcepts,
  };

  await fs.writeFile(outputPath, JSON.stringify(finalJsonWithScaledWeights, null, 2));

  console.log(`Data processing pipeline finished. Profile written to ${outputPath}`);
}

export function run() {
  // Allow the script to be run directly from the command line
  if (require.main === module) {
    main();
  }
}

run();
