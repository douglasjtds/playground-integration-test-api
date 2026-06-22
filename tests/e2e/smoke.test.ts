/**
 * Smoke tests E2E — validam o sistema de ponta a ponta via HTTP real.
 *
 * Diferente dos testes de integração (Supertest), estes fazem requests HTTP
 * reais contra um servidor rodando em uma porta real, capturando problemas
 * de CORS, binding de porta, variáveis de ambiente e middlewares de rede.
 *
 * Para rodar: inicie o servidor (npm run dev) e execute npm run test:e2e:local
 */

import { api, BASE_URL } from './helpers/client.js';
import { describe, expect, it } from 'vitest';

/** Gera um email único para evitar conflitos entre testes */
function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

console.log(`\n🔗 Smoke tests rodando contra: ${BASE_URL}\n`);

// ── Servidor ──

describe('Servidor', () => {
  it('GET /health deve retornar 200 com status ok', async () => {
    const { status, data } = await api('GET', '/health');

    expect(status).toBe(200);
    expect(data.status).toBe('ok');
  });
});

// ── Autenticação ──

describe('Autenticação', () => {
  it('POST /auth/register deve registrar usuário com dados válidos e retornar 201 com token', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      name: 'Usuário E2E',
      email: uniqueEmail(),
      password: 'senha123456',
      role: 'MEMBER',
    });

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user).toBeDefined();
    expect(data.data.user.name).toBe('Usuário E2E');
    expect(data.data.user).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/register deve retornar 400 com email inválido', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      name: 'Teste',
      email: 'email-invalido',
      password: 'senha123456',
      role: 'MEMBER',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('POST /auth/login deve autenticar com credenciais corretas e retornar token', async () => {
    const email = uniqueEmail();
    const password = 'senha123456';

    // Registra primeiro
    await api('POST', '/auth/register', {
      name: 'Login Teste',
      email,
      password,
      role: 'MEMBER',
    });

    // Faz login
    const { status, data } = await api('POST', '/auth/login', { email, password });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user).toBeDefined();
  });

  it('POST /auth/login deve retornar 401 com senha incorreta', async () => {
    const email = uniqueEmail();

    // Registra primeiro
    await api('POST', '/auth/register', {
      name: 'Senha Errada',
      email,
      password: 'senha123456',
      role: 'MEMBER',
    });

    // Tenta login com senha errada
    const { status, data } = await api('POST', '/auth/login', {
      email,
      password: 'senha-errada',
    });

    expect(status).toBe(401);
    expect(data.success).toBe(false);
  });
});

// ── Fluxo crítico: Projeto → Task → Transição de status ──

describe('Fluxo crítico: Projeto → Task → Transição de status', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const { data } = await api('POST', '/auth/register', {
      name: 'Dev Fluxo E2E',
      email: uniqueEmail(),
      password: 'senha123456',
      role: 'MEMBER',
    });

    token = data.data.token;
    userId = data.data.user.id;
  });

  it('deve criar um projeto com sucesso', async () => {
    const { status, data } = await api(
      'POST',
      '/projects',
      { name: 'Projeto E2E', description: 'Projeto criado no smoke test', ownerId: userId },
      token,
    );

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.name).toBe('Projeto E2E');
  });

  it('deve buscar o projeto criado por ID', async () => {
    // Cria projeto
    const createRes = await api(
      'POST',
      '/projects',
      { name: 'Projeto Busca E2E', description: 'Para buscar por ID', ownerId: userId },
      token,
    );
    const projectId = createRes.data.data.id;

    // Busca por ID
    const { status, data } = await api('GET', `/projects/${projectId}`, undefined, token);

    expect(status).toBe(200);
    expect(data.data.id).toBe(projectId);
    expect(data.data.name).toBe('Projeto Busca E2E');
  });

  it('deve completar o ciclo: criar task → transições de status → filtrar por projeto', async () => {
    // Cria projeto
    const projectRes = await api(
      'POST',
      '/projects',
      { name: 'Projeto Ciclo E2E', description: 'Fluxo completo', ownerId: userId },
      token,
    );
    const projectId = projectRes.data.data.id;

    // Cria task
    const taskRes = await api(
      'POST',
      '/tasks',
      { projectId, title: 'Task E2E', priority: 'MEDIUM' },
      token,
    );

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.data.data.id;
    expect(taskRes.data.data.status).toBe('TODO');

    // Transição TODO → IN_PROGRESS (válida)
    const inProgressRes = await api(
      'PATCH',
      `/tasks/${taskId}/status`,
      { status: 'IN_PROGRESS' },
      token,
    );

    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.data.data.status).toBe('IN_PROGRESS');

    // Transição IN_PROGRESS → DONE (válida)
    const doneRes = await api(
      'PATCH',
      `/tasks/${taskId}/status`,
      { status: 'DONE' },
      token,
    );

    expect(doneRes.status).toBe(200);
    expect(doneRes.data.data.status).toBe('DONE');

    // Transição DONE → IN_PROGRESS (inválida — deve falhar)
    const failRes = await api(
      'PATCH',
      `/tasks/${taskId}/status`,
      { status: 'IN_PROGRESS' },
      token,
    );

    expect(failRes.status).toBe(400);
    expect(failRes.data.success).toBe(false);

    // Filtra tasks por projectId
    const filterRes = await api('GET', `/tasks?projectId=${projectId}`, undefined, token);

    expect(filterRes.status).toBe(200);
    expect(filterRes.data.data.length).toBeGreaterThanOrEqual(1);
    expect(filterRes.data.data.some((t: any) => t.id === taskId)).toBe(true);
  });

  it('deve rejeitar transição direta TODO → DONE', async () => {
    // Cria projeto + task
    const projectRes = await api(
      'POST',
      '/projects',
      { name: 'Projeto Transição E2E', description: 'Teste de transição inválida', ownerId: userId },
      token,
    );
    const projectId = projectRes.data.data.id;

    const taskRes = await api(
      'POST',
      '/tasks',
      { projectId, title: 'Task Transição Inválida', priority: 'LOW' },
      token,
    );
    const taskId = taskRes.data.data.id;

    // Tenta TODO → DONE diretamente (inválida)
    const { status, data } = await api(
      'PATCH',
      `/tasks/${taskId}/status`,
      { status: 'DONE' },
      token,
    );

    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });
});

// ── Proteção de rotas ──

describe('Proteção de rotas', () => {
  it('GET /projects sem token deve retornar 401', async () => {
    const { status } = await api('GET', '/projects');

    expect(status).toBe(401);
  });

  it('POST /projects sem token deve retornar 401', async () => {
    const { status } = await api('POST', '/projects', {
      name: 'Projeto Sem Auth',
      description: 'Não deve funcionar',
      ownerId: 'qualquer-id',
    });

    expect(status).toBe(401);
  });
});
