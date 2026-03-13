import path from 'path';

interface File {
  path: string;
  content: string;
}

interface Chunk {
  path: string;
  content: string;
}

const MIN_CHUNK_LENGTH = 20;

export function chunkFile(file: File): Chunk[] {
  const baseName = path.basename(file.path);
  let chunks: string[] = [];

  if (baseName.includes('linkdin')) {
    // Split recommendations by multiple newlines
    chunks = file.content.split(/\n{2,}/);
  } else if (baseName.includes('cv.md')) {
    // Split CV by headings, then clean up the content
    chunks = file.content.split(/##\s+/).map(chunk => {
      // Remove the heading line itself from the chunk content
      return chunk.replace(/^[^\n]*\n/, '').trim();
    });
  } else {
    // For other files, split by line, but this is a simple default
    chunks = file.content.split('\n');
  }

  return chunks
    .map(content => content.trim())
    .filter(content => content.length >= MIN_CHUNK_LENGTH)
    .map(content => ({
      path: file.path,
      content,
    }));
}
