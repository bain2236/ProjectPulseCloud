import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import { getFromCache, saveToCache } from '../3_pipeline/llmCache';
import crypto from 'crypto';

// Mock the fs/promises module
vi.mock('fs/promises');

describe('LLM Cache', () => {
  const text = 'test content';
  const data = { result: 'test data' };
  const cacheKey = crypto.createHash('sha256').update(text).digest('hex');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getFromCache', () => {
    it('should return parsed data when cache file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue();
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(data));

      const result = await getFromCache(text);

      expect(fs.access).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    it('should return null when cache file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const result = await getFromCache(text);

      expect(fs.access).toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('saveToCache', () => {
    it('should write data to a cache file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();

      await saveToCache(text, data);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(cacheKey),
        JSON.stringify(data, null, 2)
      );
    });
  });
});
