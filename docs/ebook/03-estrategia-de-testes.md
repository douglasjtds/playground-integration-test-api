# Estratégia de Testes

## A Pirâmide de Testes

A TaskFlow API adota uma pirâmide de testes em 3 camadas, cada uma com responsabilidade e ferramentas distintas:

```
         ╱╲
        ╱ E2E╲        11 smoke tests — fetch nativo contra servidor real
       ╱──────╲
      ╱Integração╲    83 testes — Supertest + repositórios in-memory
     ╱────────────╲
    ╱   Unitários   ╲  45 testes — services isolados com vi.fn()
   ╱────────────────╲
```

| Camada | Quantidade | Ferramenta | Tempo | O que valida |
|---|---|---|---|---|
| Unitários | 45 | Vitest + vi.fn() | ~2.6s | Lógica de negócio isolada |
| Integração | 83 | Supertest + in-memory | ~8.8s | Rotas HTTP + middlewares + services |
| E2E | 11 | fetch nativo | ~1s | Deploy real (rede, CORS, env vars) |

**Total: 139 testes em ~12 segundos**, sem Docker, sem banco externo.

## Por Que In-Memory

A decisão mais importante da estratégia é usar repositórios in-memory em vez de Docker com banco real. O impacto é significativo:

- **Setup zero**: `npm install` e pronto. Sem Docker Desktop, sem `docker-compose up`, sem aguardar containers.
- **Velocidade**: 139 testes em 12 segundos. Com banco real, seriam minutos.
- **CI/CD trivial**: o pipeline do GitHub Actions não precisa de service containers.
- **Isolamento perfeito**: cada teste cria seus próprios repositórios via `createTestApp()`.

A contrapartida é clara: não testamos queries SQL, índices ou constraints do banco. Para produção, recomendamos adicionar uma camada de testes com Testcontainers.

## O Padrão createTestApp()

O coração da infraestrutura de testes é a função `createTestApp()`:

```typescript
function createTestApp(): { app: Express; repositories: Repositories }
```

Cada `describe` ou `it` cria sua própria instância do app com repositórios completamente frescos. Isso elimina o problema mais comum em testes de integração: **estado compartilhado entre testes**.

```typescript
describe('GET /projects', () => {
  it('deve retornar lista vazia', async () => {
    const { app } = createTestApp();  // app limpo
    const res = await request(app).get('/projects');
    expect(res.body.data).toHaveLength(0);
  });
});
```

## Data Factories

O módulo `data-factory.ts` usa `@faker-js/faker` com locale `pt_BR` para gerar dados de teste realistas:

- `makeUser()` — gera um DTO de criação de usuário com nome, email e senha
- `makeProject()` — gera um DTO de projeto com nome e descrição
- `makeTask()` — gera um DTO de task com título e prioridade
- `makeUserSeed()` — cria e persiste um usuário diretamente no repositório

As funções `seed` são úteis quando o teste precisa de dados pré-existentes sem passar pela API (ex: criar um owner antes de testar a criação de projetos).

## MSW para Serviços Externos

O Mock Service Worker (MSW v2) intercepta requests HTTP a serviços externos nos testes:

- **Serviço de email**: `POST https://notifications.taskflow.io/send` retorna 202 com messageId
- **ViaCEP**: `GET https://viacep.com.br/ws/:cep/json/` retorna dados de endereço
- **Fallback**: qualquer request HTTPS não mapeado retorna 500 + log de warning

O setup no Vitest garante que handlers são resetados entre testes (`afterEach: server.resetHandlers()`).

## CI/CD com GitHub Actions

O pipeline em `.github/workflows/ci.yml` executa em 3 jobs:

1. **test** — `npm run test` + `npm run test:integration` + upload de cobertura
2. **build** — `npm run build` (compilação TypeScript)
3. **e2e** — inicia o servidor, aguarda health check, roda smoke tests

Variáveis de ambiente fixas no CI: `NODE_ENV=test`, `JWT_SECRET=test-secret-for-ci`.

## Guia Prático: Como Escrever um Novo Teste

Para adicionar um teste de integração para uma nova rota:

1. Crie ou edite o arquivo em `tests/integration/`
2. Importe `createTestApp`, `makeUser`, `getAuthToken` dos helpers
3. No `describe`, crie o app: `const { app } = createTestApp()`
4. Obtenha um token: `const token = await getAuthToken(app)`
5. Faça o request: `const res = await request(app).get('/rota').set('Authorization', \`Bearer \${token}\`)`
6. Valide: `expect(res.status).toBe(200)`

Para testar um cenário com dados pré-existentes, use as funções `seed` do data-factory para popular os repositórios antes do request.
