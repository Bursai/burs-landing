// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.smoke.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default']
  }
});
