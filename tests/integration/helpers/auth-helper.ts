/**
 * Helpers de autenticação para testes de integração.
 *
 * Registram usuários de teste via API e retornam tokens JWT
 * para uso nos headers Authorization dos requests autenticados.
 */

import request from 'supertest';
import type { Express } from 'express';
import type { CreateUserDTO } from '../../../src/models/User.js';
import { UserRole } from '../../../src/models/User.js';
import { makeUser } from './data-factory.js';

/**
 * Registra um usuário de teste e retorna o token JWT.
 * Aceita overrides opcionais para personalizar o usuário criado.
 */
export async function getAuthToken(
  app: Express,
  userOverrides?: Partial<CreateUserDTO>,
): Promise<string> {
  const userData = makeUser(userOverrides);

  const response = await request(app)
    .post('/auth/register')
    .send(userData)
    .expect(201);

  return response.body.data.token;
}

/**
 * Registra um usuário ADMIN e retorna o token JWT.
 * Útil para testar rotas que exigem permissão de administrador.
 */
export async function getAdminToken(app: Express): Promise<string> {
  return getAuthToken(app, { role: UserRole.ADMIN });
}
