import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main } from '../../data/3_pipeline/process_raw_data';
import * as fs from 'fs/promises';
import { llmClient } from '../../data/3_pipeline/llmClient';

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
    const mockDirent = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });
    vi.mocked(fs.readdir).mockResolvedValue([mockDirent('cv.md')] as any);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce(JSON.stringify(mockKeywords))
      .mockResolvedValueOnce(JSON.stringify(mockBaseProfile))
      .mockResolvedValueOnce('I am an expert in react and building complex applications.');
    const writeFileMock = vi.mocked(fs.writeFile);
    vi.mocked(llmClient.generateJson).mockResolvedValue({
      evidence: { id: 'ev-1', text: 'I am an expert in react and building complex applications.' },
      concepts: [{ id: 'c-1', label: 'react' }],
    });

    await main();

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    const outputJson = JSON.parse(writeFileMock.mock.calls[0][1] as string);
    expect(outputJson.evidence).toHaveLength(1);
    expect(outputJson.concepts).toHaveLength(1); // react from LLM + react from keywords de-duplicated to 1
  });

  it('should not call the LLM when LLM_DRY_RUN is true', async () => {
    process.env.LLM_DRY_RUN = 'true';
    
    // Set up mocks
    const mockBaseProfile = { profile: {}, tabs: [], settings: {} };
    const mockKeywords = { technical: [], soft: [] };
    const mockDirent = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });
    vi.mocked(fs.readdir).mockResolvedValue([mockDirent('file.txt')] as any);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce(JSON.stringify(mockKeywords))
      .mockResolvedValueOnce(JSON.stringify(mockBaseProfile))
      .mockResolvedValueOnce('some content');
    const writeFileMock = vi.mocked(fs.writeFile);

    // If generateJson is called, it will throw an error, failing the test
    vi.mocked(llmClient.generateJson).mockRejectedValue(new Error('LLM should not have been called!'));

    // We expect this to run without throwing an error
    await expect(main()).resolves.toBeUndefined();
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });
});
