import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

const cacheDir = path.join(__dirname, '..', '.llm-cache');

// Ensure the cache directory exists
fs.mkdir(cacheDir, { recursive: true });

function getCacheKey(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function getFromCache(text: string): Promise<any | null> {
  const cacheKey = getCacheKey(text);
  const filePath = path.join(cacheDir, `${cacheKey}.json`);

  try {
    await fs.access(filePath);
    const cachedData = await fs.readFile(filePath, 'utf-8');
    console.log(`[CACHE HIT] Found cached response for text chunk.`);
    return JSON.parse(cachedData);
  } catch {
    return null; // Not in cache
  }
}

export async function saveToCache(text: string, data: any): Promise<void> {
  const cacheKey = getCacheKey(text);
  const filePath = path.join(cacheDir, `${cacheKey}.json`);
  console.log(`[CACHE MISS] Saving new LLM response to cache.`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
