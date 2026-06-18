/**
 * Factory para criar instâncias isoladas da aplicação nos testes de integração.
 *
 * Cada chamada a createTestApp() retorna um app Express e repositórios completamente
 * independentes, garantindo que nenhum estado vaze entre os testes.
 */

import { createRepositories, type Repositories } from '../../../src/repositories/index.js';
import { createApp } from '../../../src/app.js';
import type { Express } from 'express';

/** Resultado da criação de um app de teste */
export interface TestApp {
  app: Express;
  repositories: Repositories;
}

/**
 * Cria uma instância isolada do Express com repositórios frescos.
 * Use uma instância por describe/it para evitar estado compartilhado.
 */
export function createTestApp(): TestApp {
  const repositories = createRepositories();
  const app = createApp(repositories);
  return { app, repositories };
}
