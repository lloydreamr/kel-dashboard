import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export const vitestConfig = defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    // Isolate tests to prevent state pollution between files
    isolate: true,
    // Increase test timeout for slower tests
    testTimeout: 15000,
    // Limit concurrency to reduce resource contention
    maxConcurrency: 5,
    // File parallelism (default is CPU cores, reduce to avoid timeout)
    fileParallelism: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules',
        '.next',
        'src/components/ui/**', // Generated shadcn/ui components
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

// Note: Vitest config requires export default
export default vitestConfig;
