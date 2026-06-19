import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, type TestApp } from './helpers/app-factory.js';
import { getAuthToken } from './helpers/auth-helper.js';
import { makeTask, makeComment, makeUserSeed, makeProjectSeed, makeTaskSeed } from './helpers/data-factory.js';
import { TaskStatus, Priority } from '../../src/models/Task.js';
import type { Repositories } from '../../src/repositories/index.js';

describe('Tasks API', () => {
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

  // ── POST /tasks ──

  describe('POST /tasks', () => {
    it('deve criar task com dados válidos e retornar 201', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);

      const taskData = makeTask({ projectId: project.id });

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          projectId: project.id,
          title: taskData.title,
          status: TaskStatus.TODO,
        }),
      );
      expect(res.body.data.id).toBeDefined();
    });

    it('deve retornar 400 quando campos obrigatórios estão ausentes', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app)
        .post('/tasks')
        .send(makeTask())
        .expect(401);
    });

    it('deve retornar 404 quando projeto não existe', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(makeTask({ projectId: '00000000-0000-0000-0000-000000000000' }))
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /tasks/:id ──

  describe('GET /tasks/:id', () => {
    it('deve retornar a task correta por ID', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id, { title: 'Minha Task' });

      const res = await request(app)
        .get(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: task.id,
          title: 'Minha Task',
          status: TaskStatus.TODO,
        }),
      );
    });

    it('deve retornar 404 quando task não existe', async () => {
      await request(app)
        .get('/tasks/id-inexistente')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ── PUT /tasks/:id ──

  describe('PUT /tasks/:id', () => {
    it('deve atualizar os campos da task', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Título Atualizado', priority: Priority.CRITICAL })
        .expect(200);

      expect(res.body.data.title).toBe('Título Atualizado');
      expect(res.body.data.priority).toBe(Priority.CRITICAL);
    });
  });

  // ── DELETE /tasks/:id ──

  describe('DELETE /tasks/:id', () => {
    it('deve deletar a task com sucesso e retornar 204', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      await request(app)
        .delete(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app)
        .get(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('deve retornar 409 quando task está IN_PROGRESS', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);
      repos.taskRepo.update(task.id, { status: TaskStatus.IN_PROGRESS });

      const res = await request(app)
        .delete(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /tasks/:id/status ──

  describe('PATCH /tasks/:id/status', () => {
    it('deve permitir transição TODO → IN_PROGRESS', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('deve permitir transição IN_PROGRESS → DONE', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);
      repos.taskRepo.update(task.id, { status: TaskStatus.IN_PROGRESS });

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.DONE);
    });

    it('deve retornar 400 para transição inválida TODO → DONE', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.DONE })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 para transição inválida DONE → IN_PROGRESS', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);
      repos.taskRepo.update(task.id, { status: TaskStatus.IN_PROGRESS });
      repos.taskRepo.update(task.id, { status: TaskStatus.DONE });

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve permitir transição TODO → CANCELLED', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.CANCELLED })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.CANCELLED);
    });

    it('deve permitir transição IN_PROGRESS → CANCELLED', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);
      repos.taskRepo.update(task.id, { status: TaskStatus.IN_PROGRESS });

      const res = await request(app)
        .patch(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.CANCELLED })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.CANCELLED);
    });

    it('deve retornar 404 quando task não existe', async () => {
      await request(app)
        .patch('/tasks/id-inexistente/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(404);
    });
  });

  // ── GET /tasks com filtros ──

  describe('GET /tasks (filtros)', () => {
    let ownerId: string;
    let projectAId: string;
    let projectBId: string;

    beforeEach(() => {
      const owner = makeUserSeed(repos.userRepo);
      ownerId = owner.id;
      const projectA = makeProjectSeed(repos.projectRepo, ownerId, { name: 'Projeto A' });
      const projectB = makeProjectSeed(repos.projectRepo, ownerId, { name: 'Projeto B' });
      projectAId = projectA.id;
      projectBId = projectB.id;

      makeTaskSeed(repos.taskRepo, projectAId, { title: 'Task A1', priority: Priority.HIGH });
      makeTaskSeed(repos.taskRepo, projectAId, { title: 'Task A2', priority: Priority.LOW });
      const taskB = makeTaskSeed(repos.taskRepo, projectBId, { title: 'Task B1', priority: Priority.HIGH });
      repos.taskRepo.update(taskB.id, { status: TaskStatus.IN_PROGRESS });
    });

    it('deve filtrar por ?projectId retornando apenas tasks do projeto', async () => {
      const res = await request(app)
        .get('/tasks')
        .query({ projectId: projectAId })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      res.body.data.forEach((t: any) => expect(t.projectId).toBe(projectAId));
    });

    it('deve filtrar por ?status=IN_PROGRESS', async () => {
      const res = await request(app)
        .get('/tasks')
        .query({ status: TaskStatus.IN_PROGRESS })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('deve filtrar por ?priority=HIGH', async () => {
      const res = await request(app)
        .get('/tasks')
        .query({ priority: Priority.HIGH })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      res.body.data.forEach((t: any) => expect(t.priority).toBe(Priority.HIGH));
    });

    it('deve combinar filtros corretamente', async () => {
      const res = await request(app)
        .get('/tasks')
        .query({ projectId: projectAId, priority: Priority.HIGH })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Task A1');
    });
  });

  // ── Comments ──

  describe('POST /tasks/:id/comments', () => {
    it('deve criar comentário com sucesso em task existente', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const res = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(task.id);
      expect(res.body.data.content).toBeDefined();
    });

    it('deve retornar 404 quando task não existe', async () => {
      await request(app)
        .post('/tasks/id-inexistente/comments')
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(404);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      await request(app)
        .post(`/tasks/${task.id}/comments`)
        .send(makeComment())
        .expect(401);
    });
  });

  describe('GET /tasks/:id/comments', () => {
    it('deve listar comentários de uma task', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      // Cria 2 comentários via API
      await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(201);

      await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(201);

      const res = await request(app)
        .get(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /tasks/:id/comments/:commentId', () => {
    it('deve deletar comentário próprio com sucesso', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      const commentRes = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(201);

      const commentId = commentRes.body.data.id;

      await request(app)
        .delete(`/tasks/${task.id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('deve retornar 403 quando tenta deletar comentário de outro usuário', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      // User1 cria o comentário
      const commentRes = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(makeComment())
        .expect(201);

      const commentId = commentRes.body.data.id;

      // User2 tenta deletar
      const token2 = await getAuthToken(app);

      const res = await request(app)
        .delete(`/tasks/${task.id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 404 quando comentário não existe', async () => {
      const owner = makeUserSeed(repos.userRepo);
      const project = makeProjectSeed(repos.projectRepo, owner.id);
      const task = makeTaskSeed(repos.taskRepo, project.id);

      await request(app)
        .delete(`/tasks/${task.id}/comments/id-inexistente`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ── Fluxo completo (happy path) ──

  describe('Fluxo completo: Projeto → Task → Transições → Comentário', () => {
    it('deve completar o ciclo de vida de uma task com sucesso', async () => {
      // Registra usuário e obtém token + userId
      const registerRes = await request(app)
        .post('/auth/register')
        .send({ name: 'Dev Teste', email: 'dev@flow.com', password: 'senha123456' })
        .expect(201);

      const flowToken = registerRes.body.data.token;
      const userId = registerRes.body.data.user.id;

      // 1. Cria um projeto
      const projectRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ name: 'Projeto Flow', description: 'Projeto do fluxo completo', ownerId: userId })
        .expect(201);

      const projectId = projectRes.body.data.id;

      // 2. Cria uma task nesse projeto
      const taskRes = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ projectId, title: 'Task do fluxo', priority: 'MEDIUM' })
        .expect(201);

      const taskId = taskRes.body.data.id;
      expect(taskRes.body.data.status).toBe(TaskStatus.TODO);

      // 3. Muda status para IN_PROGRESS
      const inProgressRes = await request(app)
        .patch(`/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(inProgressRes.body.data.status).toBe(TaskStatus.IN_PROGRESS);

      // 4. Adiciona um comentário
      const commentRes = await request(app)
        .post(`/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ content: 'Iniciando o trabalho nessa task' })
        .expect(201);

      expect(commentRes.body.data.taskId).toBe(taskId);

      // 5. Muda status para DONE
      const doneRes = await request(app)
        .patch(`/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      expect(doneRes.body.data.status).toBe(TaskStatus.DONE);

      // 6. Tenta mudar de volta para IN_PROGRESS — deve falhar
      const failRes = await request(app)
        .patch(`/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(400);

      expect(failRes.body.success).toBe(false);
    });
  });
});
