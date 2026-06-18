/**
 * Arquivo de setup global para os testes de integração (setupFile do Vitest).
 *
 * Configura variáveis de ambiente, inicializa o MSW e registra hooks globais
 * que se aplicam a todas as suítes de integração.
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../msw/server.js';

// Garante que os testes rodam em ambiente de teste
process.env.NODE_ENV = 'test';

// Secret fixo para testes — garante tokens determinísticos
process.env.JWT_SECRET = 'test-secret-for-integration';

// Porta diferente para evitar conflito com dev server
process.env.PORT = '0';

// Inicia o servidor MSW antes de todos os testes.
// onUnhandledRequest: 'warn' loga requests não mapeados sem falhar o teste.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reseta handlers sobrescritos após cada teste para evitar vazamento entre testes.
afterEach(() => {
  server.resetHandlers();
});

// Encerra o servidor MSW após todos os testes.
afterAll(() => {
  server.close();
});
