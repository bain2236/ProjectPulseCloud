import { readAllFiles } from './fileReader';
import { processRawText } from './processor';
import { assembleFinalJson } from './assembler';
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
  const { profile, tabs } = baseProfileData;

  const rawFiles = await readAllFiles(rawDataPath);
  
  const processedData = [];
  for (const file of rawFiles) {
    const result = await processRawText(file.content, file.path);
    if (result) {
      processedData.push(result);
    }
  }

  const finalJson = assembleFinalJson(profile, tabs, processedData);

  await fs.writeFile(outputPath, JSON.stringify(finalJson, null, 2));

  console.log(`Data processing pipeline finished. Profile written to ${outputPath}`);
}

// Allow the script to be run directly from the command line
if (require.main === module) {
  main();
}
