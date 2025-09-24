import { readAllFiles } from './fileReader.ts';
import { processRawText } from './processor.ts';
import { assembleFinalJson } from './assembler.ts';
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

  const baseProfileContent = await fs.readFile(baseProfilePath, 'utf-8');
  const baseProfileData = JSON.parse(baseProfileContent);
  const { profile, tabs, settings } = baseProfileData;

  const rawFiles = await readAllFiles(rawDataPath);
  
  const chunksToProcess: { content: string, path: string }[] = [];

  for (const file of rawFiles) {
    if (path.basename(file.path) === 'linkdin.txt') {
      // Split by 3+ newlines to separate recommendations automatically
      const recommendations = file.content.split(/\n\s*\n\s*\n/).map(r => r.trim()).filter(r => r);
      recommendations.forEach(rec => chunksToProcess.push({ content: rec, path: file.path }));
    } else if (path.basename(file.path) === 'software_engineer_cv.md') {
      // Split by markdown headings
      const sections = file.content.split('## ').map(s => s.trim()).filter(s => s);
      sections.forEach(sec => chunksToProcess.push({ content: `## ${sec}`, path: file.path }));
    } else {
      chunksToProcess.push(file);
    }
  }

  const processedData = [];
  for (const chunk of chunksToProcess) {
    console.log(`Processing chunk from ${chunk.path}...`);
    const result = await processRawText(chunk.content, chunk.path);
    if (result) {
      processedData.push(result);
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
