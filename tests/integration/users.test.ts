import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, type TestApp } from './helpers/app-factory.js';
import { getAuthToken, getAdminToken } from './helpers/auth-helper.js';
import { makeUser, makeUserSeed, makeProjectSeed, makeTaskSeed } from './helpers/data-factory.js';
import { TaskStatus } from '../../src/models/Task.js';
import type { Repositories } from '../../src/repositories/index.js';

describe('Users API', () => {
  let testApp: TestApp;
  let app: Express;
  let repos: Repositories;
  let token: string;

  beforeEach(async () => {
    testApp = createTestApp();
    app = testApp.app;
    repos = testApp.repositories;
    token = await getAuthToken(app);
  });

  // ── GET /users ──

  describe('GET /users', () => {
    it('deve retornar lista de usuários sem passwordHash em nenhum objeto', async () => {
      // O getAuthToken já registrou 1 usuário; vamos registrar mais
      await request(app)
        .post('/auth/register')
        .send(makeUser())
        .expect(201);

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((u: any) => {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).toHaveProperty('id');
        expect(u).toHaveProperty('name');
        expect(u).toHaveProperty('email');
      });
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app)
        .get('/users')
        .expect(401);
    });

    it('ADMIN pode listar todos os usuários', async () => {
      const adminToken = await getAdminToken(app);

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('MEMBER pode listar usuários', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ── GET /users/:id ──

  describe('GET /users/:id', () => {
    it('deve retornar o usuário por ID sem passwordHash', async () => {
      const user = makeUserSeed(repos.userRepo);

      const res = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      await request(app)
        .get('/users/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ── PATCH /users/:id ──

  describe('PATCH /users/:id', () => {
    it('deve atualizar dados do usuário com sucesso', async () => {
      const user = makeUserSeed(repos.userRepo);

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect(res.body.data.name).toBe('Nome Atualizado');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      await request(app)
        .patch('/users/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Novo' })
        .expect(404);
    });

    it('ADMIN pode atualizar qualquer usuário', async () => {
      const adminToken = await getAdminToken(app);
      const user = makeUserSeed(repos.userRepo);

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Atualizado por Admin' })
        .expect(200);

      expect(res.body.data.name).toBe('Atualizado por Admin');
    });
  });

  // ── PUT /users/:id ──

  describe('PUT /users/:id', () => {
    it('deve substituir dados do usuário', async () => {
      const user = makeUserSeed(repos.userRepo);

      const res = await request(app)
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome Completo Novo' })
        .expect(200);

      expect(res.body.data.name).toBe('Nome Completo Novo');
    });
  });

  // ── DELETE /users/:id ──

  describe('DELETE /users/:id', () => {
    it('deve deletar usuário sem tasks ativas com sucesso', async () => {
      const user = makeUserSeed(repos.userRepo);

      await request(app)
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('deve retornar 403 quando usuário tem tasks IN_PROGRESS', async () => {
      const user = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, user.id);
      const task = makeTaskSeed(repos.taskRepo, project.id, { assigneeId: user.id });
      repos.taskRepo.update(task.id, { status: TaskStatus.IN_PROGRESS });

      const res = await request(app)
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      await request(app)
        .delete('/users/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('ADMIN pode deletar qualquer usuário sem tasks ativas', async () => {
      const adminToken = await getAdminToken(app);
      const user = makeUserSeed(repos.userRepo);

      await request(app)
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  // ── Segurança de tokens ──

  describe('Segurança de tokens', () => {
    it('deve retornar 401 com token inválido em rotas de users', async () => {
      await request(app)
        .get('/users')
        .set('Authorization', 'Bearer token-completamente-invalido')
        .expect(401);
    });

    it('deve retornar 401 com token manipulado em rotas de users', async () => {
      const parts = token.split('.');
      parts[1] = parts[1].slice(0, -2) + 'XX';
      const tamperedToken = parts.join('.');

      await request(app)
        .delete(`/users/qualquer-id`)
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });
});
