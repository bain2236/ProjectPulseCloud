import { describe, it, expect, vi } from 'vitest';
import { main } from '../../data/3_pipeline/process_raw_data';
import { llmClient } from '../../data/3_pipeline/llmClient';
import * as fs from 'fs/promises';

// Mock the dependencies
vi.mock('fs/promises');
vi.mock('../../data/3_pipeline/llmClient');

describe('Pipeline Integration Test', () => {
  it('should read raw files, process them, and write the final json with settings', async () => {
    // --- MOCK SETUP ---
    const mockBaseProfile = {
      profile: { displayName: 'Test User' },
      tabs: [{ id: 'test', title: 'Test' }],
      settings: { recencyDecayDays: 365 },
    };

    const mockRawFiles = [
      { path: 'data/1_raw/recommendations/rec1.txt', content: 'good collaborator' },
      { path: 'data/1_raw/cv/cv.md', content: 'expert in react' },
    ];

    const mockLlmResponses = {
      'good collaborator': {
        evidence: { id: 'ev-1', text: 'good collaborator' },
        concepts: [{ id: 'c-collab', label: 'collaboration', sourceEvidenceIds: ['ev-1'] }],
      },
      'expert in react': {
        evidence: { id: 'ev-2', text: 'expert in react' },
        concepts: [{ id: 'c-react', label: 'react', sourceEvidenceIds: ['ev-2'] }],
      },
    };

    // Mock file system reads
    const mockDirent = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });
    vi.mocked(fs.readdir).mockResolvedValue([mockDirent('rec1.txt'), mockDirent('cv.md')] as any);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce(JSON.stringify(mockBaseProfile)) // For base-profile.json
      .mockResolvedValueOnce('good collaborator')
      .mockResolvedValueOnce('expert in react');
    vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true } as any);

    // Mock file system write
    const writeFileMock = vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    
    // Mock LLM client
    vi.mocked(llmClient.generateJson).mockImplementation(async (text: string) => {
      return (mockLlmResponses as any)[text];
    });

    // --- EXECUTION ---
    await main();

    // --- ASSERTIONS ---
    expect(writeFileMock).toHaveBeenCalledTimes(1);

    const writeCall = writeFileMock.mock.calls[0];
    const outputPath = (writeCall[0] as string).replace(/\\/g, '/');
    const outputJson = JSON.parse(writeCall[1] as string);
    
    expect(outputPath).toContain('project/public/profile.json');
    expect(outputJson.evidence).toHaveLength(2);
    expect(outputJson.concepts).toHaveLength(2);
    expect(outputJson.profile).toBeDefined();
    expect(outputJson.concepts.find((c:any) => c.label === 'react')).toBeDefined();
    expect(outputJson.settings).toBeDefined();
    expect(outputJson.settings.recencyDecayDays).toBe(365);
    expect(outputJson.profile).toEqual(mockBaseProfile.profile); // Also check profile content
  });
});
