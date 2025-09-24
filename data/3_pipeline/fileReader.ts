import * as fs from 'fs/promises';
import * as path from 'path';

export async function readAllFiles(directoryPath: string): Promise<{ path: string; content: string }[]> {
  const filesData: { path: string; content: string }[] = [];
  
  try {
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const content = await fs.readFile(filePath, 'utf-8');
        filesData.push({ path: filePath, content: content.trim() });
      }
    }
  } catch (error) {
    throw error;
  }
  
  return filesData;
}
