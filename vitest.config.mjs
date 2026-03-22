import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/actions/__tests__/**/*.test.js',
      'src/preflight/__tests__/**/*.test.js',
      'presets/**/__tests__/**/*.test.{js,ts}',
    ],
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/index.js'],
    },
    globals: true,
  },
});