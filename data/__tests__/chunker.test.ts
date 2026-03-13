import { describe, it, expect } from 'vitest';
import { chunkFile } from '../3_pipeline/chunker';

describe('Smart Chunker Utility', () => {
  it('should split recommendations by separator and keep long text', () => {
    const file = { path: 'linkdin.txt', content: 'This is the first long recommendation that should be kept.\n\n\nThis is the second long recommendation, also to be kept.' };
    const chunks = chunkFile(file);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('This is the first long recommendation that should be kept.');
  });

  it('should split CV by headings but exclude the headings and keep long text', () => {
    const file = { path: 'cv.md', content: '## Section 1\nThis is the first long section of the CV with plenty of text.\n## Section 2\nThis is the second long section of the CV, also with plenty of text.' };
    const chunks = chunkFile(file);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('This is the first long section of the CV with plenty of text.');
    expect(chunks[1].content).toBe('This is the second long section of the CV, also with plenty of text.');
  });

  it('should split linkdin.txt recommendations separated by double-newlines', () => {
    const file = {
      path: 'linkdin.txt',
      content: [
        'Amogh Madan\n· 1stFirst degree connection\nSenior Software Engineer @ One Impression\nSeptember 11, 2025, Amogh worked with Alex on the same team\nHe is a positive and hard working person making it a delight to work with him.',
        'Phil Davies\n· 1stFirst degree connection\nCIO at Clinithink\nSeptember 2, 2025, Phil managed Alex directly\nI worked with Alex for over 4 years and during that time he has grown from a software engineer through to a tech lead.',
      ].join('\n\n'),
    };
    const chunks = chunkFile(file);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toContain('Amogh Madan');
    expect(chunks[1].content).toContain('Phil Davies');
  });

  it('should split linkdin.txt recommendations separated by triple-newlines', () => {
    const file = {
      path: 'linkdin.txt',
      content: [
        'Amogh Madan\n· 1stFirst degree connection\nSenior Software Engineer @ One Impression\nSeptember 11, 2025, Amogh worked with Alex on the same team\nHe is a positive and hard working person making it a delight to work with him.',
        'Phil Davies\n· 1stFirst degree connection\nCIO at Clinithink\nSeptember 2, 2025, Phil managed Alex directly\nI worked with Alex for over 4 years and during that time he has grown from a software engineer through to a tech lead.',
      ].join('\n\n\n'),
    };
    const chunks = chunkFile(file);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toContain('Amogh Madan');
    expect(chunks[1].content).toContain('Phil Davies');
  });

  it('should filter out chunks that are too short to be meaningful', () => {
    const file = { path: 'other.txt', content: 'This is a meaningful line that is definitely long enough.\nShort.\nThis is also meaningful and should be kept as a chunk.' };
    const chunks = chunkFile(file);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('This is a meaningful line that is definitely long enough.');
  });
});
