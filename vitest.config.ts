// Configuração do Vitest para testes unitários
// Executa apenas testes em tests/unit/ com cobertura focada nos services

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/services/**'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
