// Configuração do Vitest para testes E2E (smoke tests)
// Executa testes em tests/e2e/ contra um servidor HTTP real — sem Supertest, sem MSW, sem coverage

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        execArgv: [],
      },
    },
    env: {
      BASE_URL: process.env.BASE_URL ?? 'http://localhost:3000',
    },
  },
});
