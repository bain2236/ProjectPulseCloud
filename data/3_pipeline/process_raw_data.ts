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
  const outputPath = path.join(__dirname, '..', '..', 'project', 'public', 'profile.json');

  // TODO: Load base profile and tabs from a file instead of hardcoding
  const baseProfile = {
    "slug": "alex-bainbridge",
    "displayName": "Alex Bainbridge",
    "public": true,
    "theme": "neon-dark",
    "createdAt": new Date().toISOString(),
    "bio": "Full-stack engineer passionate about building beautiful, accessible experiences.",
    "avatar": "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200",
    "location": "United Kingdom",
    "website": "https://alex.dev"
  };
  const tabs = [
    { "id": "personal", "title": "Personal", "order": 0 },
    { "id": "leader", "title": "Leader", "order": 1 },
    { "id": "engineer", "title": "Engineer", "order": 2 },
    { "id": "colleague", "title": "Colleague", "order": 3 }
  ];

  const rawFiles = await readAllFiles(rawDataPath);
  
  const processedData = [];
  for (const file of rawFiles) {
    const result = await processRawText(file.content, file.path);
    if (result) {
      processedData.push(result);
    }
  }

  const finalJson = assembleFinalJson(baseProfile, tabs, processedData);

  await fs.writeFile(outputPath, JSON.stringify(finalJson, null, 2));

  console.log(`Data processing pipeline finished. Profile written to ${outputPath}`);
}

// Allow the script to be run directly from the command line
if (require.main === module) {
  main();
}
