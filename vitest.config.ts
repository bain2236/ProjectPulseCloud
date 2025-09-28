import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './project/vitest.setup.tsx',
    include: ['project/components/**/*.test.tsx', 'data/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['data/3_pipeline/**/*.ts'],
      exclude: ['data/3_pipeline/**/*.test.ts', 'data/__tests__/**', 'data/3_pipeline/llmClient.ts', 'data/3_pipeline/prompts/systemPrompt.ts'],
      all: true,
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
});
