/**
 * Barrel export de todos os helpers de integração.
 * Permite importar tudo de um único ponto:
 *   import { createTestApp, makeUser, getAuthToken } from './helpers/index.js';
 */

export { createTestApp, type TestApp } from './app-factory.js';
export {
  makeUser,
  makeProject,
  makeTask,
  makeComment,
  makeUserSeed,
  makeProjectSeed,
  makeTaskSeed,
} from './data-factory.js';
export { getAuthToken, getAdminToken } from './auth-helper.js';
