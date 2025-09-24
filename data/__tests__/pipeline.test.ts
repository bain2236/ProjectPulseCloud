import { describe, it, expect, beforeEach } from 'vitest';
import { readAllFiles } from '../../data/3_pipeline/fileReader';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('File Reading Utility', () => {
  const testDataDir = path.join(__dirname, 'testData');
  const filesDir = path.join(testDataDir, 'files');
  const emptyDir = path.join(testDataDir, 'empty');
  const nonexistentDir = path.join(testDataDir, 'nonexistent');

  beforeEach(async () => {
    // Ensure the directories exist and are in a clean state
    await fs.rm(testDataDir, { recursive: true, force: true });
    await fs.mkdir(filesDir, { recursive: true });
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(filesDir, 'file1.txt'), 'This is file 1.');
    await fs.writeFile(path.join(filesDir, 'file2.md'), '# This is file 2');
  });

  it('should read all files from a directory and return their content', async () => {
    const result = await readAllFiles(filesDir);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      path: expect.stringContaining('file1.txt'),
      content: 'This is file 1.',
    });
    expect(result).toContainEqual({
      path: expect.stringContaining('file2.md'),
      content: '# This is file 2',
    });
  });

  it('should return an empty array for an empty directory', async () => {
    const result = await readAllFiles(emptyDir);
    expect(result).toHaveLength(0);
  });

  it('should throw an error for a non-existent directory', async () => {
    await expect(readAllFiles(nonexistentDir)).rejects.toThrow(
      /ENOENT: no such file or directory/
    );
  });
});
