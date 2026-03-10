import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/actions/__tests__/**/*.test.js'],
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/index.js'],
    },
    globals: true,
  },
});