import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, type TestApp } from './helpers/app-factory.js';
import { getAuthToken } from './helpers/auth-helper.js';
import { makeProject, makeUserSeed, makeProjectSeed, makeTaskSeed } from './helpers/data-factory.js';
import { ProjectStatus } from '../../src/models/Project.js';
import type { Repositories } from '../../src/repositories/index.js';

describe('Projects API', () => {
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

  // ── GET /projects ──

  describe('GET /projects', () => {
    it('deve retornar lista vazia quando não há projetos', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('deve retornar todos os projetos criados', async () => {
      const owner = makeUserSeed(repos.userRepo);
      makeProjectSeed(repos.projectRepo, owner.id, { name: 'Projeto A' });
      makeProjectSeed(repos.projectRepo, owner.id, { name: 'Projeto B' });

      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('deve filtrar por status quando ?status=ACTIVE é passado', async () => {
      const owner = makeUserSeed(repos.userRepo);
      makeProjectSeed(repos.projectRepo, owner.id, { name: 'Ativo' });
      const archived = makeProjectSeed(repos.projectRepo, owner.id, { name: 'Arquivado' });
      repos.projectRepo.update(archived.id, { status: ProjectStatus.ARCHIVED });

      const res = await request(app)
        .get('/projects')
        .query({ status: 'ACTIVE' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Ativo');
    });

    it('deve retornar 401 quando não autenticado', async () => {
      await request(app)
        .get('/projects')
        .expect(401);
    });
  });

  // ── GET /projects/:id ──

  describe('GET /projects/:id', () => {
    it('deve retornar o projeto correto por ID', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id, { name: 'Meu Projeto' });

      const res = await request(app)
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: project.id,
          name: 'Meu Projeto',
          status: ProjectStatus.ACTIVE,
        }),
      );
    });

    it('deve retornar 404 quando ID não existe', async () => {
      const res = await request(app)
        .get('/projects/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /projects ──

  describe('POST /projects', () => {
    it('deve criar projeto com dados válidos e retornar 201', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const projectData = makeProject({ ownerId: owner.id });

      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          name: projectData.name,
          description: projectData.description,
          ownerId: owner.id,
          status: ProjectStatus.ACTIVE,
        }),
      );
      expect(res.body.data.id).toBeDefined();
    });

    it('deve retornar 400 quando campos obrigatórios estão ausentes', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 com detalhes dos erros de validação Zod', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', description: '', ownerId: 'nao-uuid' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app)
        .post('/projects')
        .send(makeProject())
        .expect(401);
    });

    it('deve retornar 404 quando ownerId não existe', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(makeProject({ ownerId: '00000000-0000-0000-0000-000000000000' }))
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── PUT /projects/:id ──

  describe('PUT /projects/:id', () => {
    it('deve substituir todos os campos do projeto', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);

      const newData = {
        name: 'Nome Substituído',
        description: 'Descrição Substituída',
        ownerId: owner.id,
      };

      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(newData)
        .expect(200);

      expect(res.body.data.name).toBe('Nome Substituído');
      expect(res.body.data.description).toBe('Descrição Substituída');
    });

    it('deve retornar 404 quando projeto não existe', async () => {
      const owner = makeUserSeed(repos.userRepo);

      await request(app)
        .put('/projects/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', description: 'Y', ownerId: owner.id })
        .expect(404);
    });
  });

  // ── PATCH /projects/:id ──

  describe('PATCH /projects/:id', () => {
    it('deve atualizar apenas os campos enviados', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id, {
        name: 'Nome Original',
        description: 'Descrição Original',
      });

      const res = await request(app)
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect(res.body.data.name).toBe('Nome Atualizado');
      expect(res.body.data.description).toBe('Descrição Original');
    });

    it('deve atualizar o status do projeto', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);

      const res = await request(app)
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ProjectStatus.COMPLETED })
        .expect(200);

      expect(res.body.data.status).toBe(ProjectStatus.COMPLETED);
    });

    it('deve retornar 400 quando status é inválido', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);

      await request(app)
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALIDO' })
        .expect(400);
    });
  });

  // ── DELETE /projects/:id ──

  describe('DELETE /projects/:id', () => {
    it('deve deletar o projeto com sucesso e retornar 204', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);

      await request(app)
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Verifica que foi realmente deletado
      await request(app)
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('deve retornar 404 quando projeto não existe', async () => {
      await request(app)
        .delete('/projects/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('deve retornar 409 quando projeto tem tasks ativas', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tasks ativas');
    });
  });
});
