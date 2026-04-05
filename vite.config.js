import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
