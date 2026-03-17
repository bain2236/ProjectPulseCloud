import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.tsx',
    include: [
      'components/**/*.test.tsx',
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
      'hooks/**/*.test.ts',
      'hooks/**/*.test.tsx',
      '../data/**/*.test.ts',
    ],
  },
});
