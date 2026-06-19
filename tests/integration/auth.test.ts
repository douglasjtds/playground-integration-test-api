import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, type TestApp } from './helpers/app-factory.js';
import { makeUser } from './helpers/data-factory.js';

describe('Auth API', () => {
  let testApp: TestApp;
  let app: Express;

  beforeEach(() => {
    testApp = createTestApp();
    app = testApp.app;
  });

  // ── POST /auth/register ──

  describe('POST /auth/register', () => {
    it('deve registrar usuário com dados válidos e retornar 201 com token', async () => {
      const userData = makeUser();

      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.name).toBe(userData.name);
      expect(res.body.data.user.email).toBe(userData.email);
    });

    it('deve nunca retornar passwordHash na resposta', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(makeUser())
        .expect(201);

      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 400 com email inválido', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(makeUser({ email: 'email-invalido' }))
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 com senha menor que 6 caracteres', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(makeUser({ password: '123' }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 409 quando email já está cadastrado', async () => {
      const userData = makeUser();
      await request(app).post('/auth/register').send(userData).expect(201);

      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /auth/login ──

  describe('POST /auth/login', () => {
    const password = 'minhaSenha123';
    let registeredEmail: string;

    beforeEach(async () => {
      const userData = makeUser({ password });
      registeredEmail = userData.email;
      await request(app).post('/auth/register').send(userData).expect(201);
    });

    it('deve autenticar com credenciais corretas e retornar token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: registeredEmail, password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 401 com senha incorreta', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: registeredEmail, password: 'senhaErrada' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 com email não cadastrado', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'naoexiste@test.com', password })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 com body inválido', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: 'invalido' })
        .expect(400);
    });

    it('deve retornar token usável em rotas autenticadas', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: registeredEmail, password })
        .expect(200);

      const token = loginRes.body.data.token;

      // Usa o token para acessar rota protegida
      const usersRes = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(usersRes.body.success).toBe(true);
    });
  });

  // ── Segurança de tokens ──

  describe('Segurança de tokens', () => {
    it('deve retornar 401 com token expirado ou inválido', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiTUVNQkVSIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalidsignature';

      await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
    });

    it('deve retornar 401 com token manipulado manualmente', async () => {
      // Registra para obter um token real
      const userData = makeUser();
      const registerRes = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const realToken = registerRes.body.data.token;
      // Manipula o payload (troca um caractere)
      const parts = realToken.split('.');
      parts[1] = parts[1].slice(0, -2) + 'XX';
      const tamperedToken = parts.join('.');

      await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('deve retornar 401 sem header Authorization', async () => {
      await request(app)
        .get('/users')
        .expect(401);
    });
  });
});
