import * as fs from 'fs/promises';
import * as path from 'path';

export async function readAllFiles(directoryPath: string): Promise<{ path: string; content: string }[]> {
  let filesData: { path: string; content: string }[] = [];

  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        filesData = filesData.concat(await readAllFiles(fullPath));
      } else if (entry.isFile()) {
        const content = await fs.readFile(fullPath, 'utf-8');
        filesData.push({ path: fullPath, content: content.trim() });
      }
    }
  } catch (error) {
    throw error;
  }

  return filesData;
}
