import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main } from '../../data/3_pipeline/process_raw_data';
import * as fs from 'fs/promises';
import { llmClient } from '../../data/3_pipeline/llmClient';
import * as path from 'path';

vi.mock('fs/promises');
vi.mock('../../data/3_pipeline/llmClient');

describe('Pipeline Integration Test', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.LLM_DRY_RUN;
  });

  it('should read raw files, process them, and write the final json', async () => {
    // Correctly set up mocks for the first test
    const mockBaseProfile = {
      profile: { displayName: 'Test User' },
      tabs: [{ id: 'test', title: 'Test' }],
      settings: { recencyDecayDays: 365 },
    };
    const mockKeywords = { technical: ['react'], soft: [] };
    const mockAboutMeContent = 'This is the about me content.';
    const mockCvContent = 'I am an expert in react and building complex applications.';
    const mockDirent = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });

    vi.mocked(fs.readdir).mockResolvedValue([
      mockDirent('keywords.json'),
      mockDirent('base-profile.json'),
      mockDirent('aboutme.md'),
      mockDirent('cv.md')
    ] as any);

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      const fileName = path.basename(filePath as string);
      if (fileName === 'keywords.json') return JSON.stringify(mockKeywords);
      if (fileName === 'base-profile.json') return JSON.stringify(mockBaseProfile);
      if (fileName === 'aboutme.md') return mockAboutMeContent;
      if (fileName === 'cv.md') return mockCvContent;
      return ''; // Default empty content
    });
    
    const writeFileMock = vi.mocked(fs.writeFile);
    vi.mocked(llmClient.generateJson).mockResolvedValue({
      evidence: { id: 'ev-1', text: mockCvContent },
      concepts: [{ id: 'c-1', label: 'react' }],
    });

    await main();

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    const outputJson = JSON.parse(writeFileMock.mock.calls[0][1] as string);
    expect(outputJson.evidence).toHaveLength(1);
    expect(outputJson.concepts).toHaveLength(1); // react from LLM + react from keywords de-duplicated to 1
    expect(outputJson.aboutMe).toBe(mockAboutMeContent);
  });

  it('should not call the LLM when LLM_DRY_RUN is true', async () => {
    process.env.LLM_DRY_RUN = 'true';
    
    // Set up mocks
    const mockBaseProfile = { profile: {}, tabs: [], settings: {} };
    const mockKeywords = { technical: [], soft: [] };
    const mockAboutMeContent = 'Dry run about me';
    const mockFileContent = 'some content';
    const mockDirent = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });
    vi.mocked(fs.readdir).mockResolvedValue([mockDirent('file.txt'), mockDirent('aboutme.md')] as any);

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      const fileName = path.basename(filePath as string);
      if (fileName === 'keywords.json') return JSON.stringify(mockKeywords);
      if (fileName === 'base-profile.json') return JSON.stringify(mockBaseProfile);
      if (fileName === 'aboutme.md') return mockAboutMeContent;
      if (fileName === 'file.txt') return mockFileContent;
      return '';
    });

    const writeFileMock = vi.mocked(fs.writeFile);

    // If generateJson is called, it will throw an error, failing the test
    vi.mocked(llmClient.generateJson).mockRejectedValue(new Error('LLM should not have been called!'));

    // We expect this to run without throwing an error
    await expect(main()).resolves.toBeUndefined();
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });
});
