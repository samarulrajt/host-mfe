import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'catalog/CatalogApp': fileURLToPath(new URL('./apps/host/src/test-stubs/CatalogApp.tsx', import.meta.url)),
      'profile/ProfileApp': fileURLToPath(new URL('./apps/host/src/test-stubs/ProfileApp.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts', 'apps/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});