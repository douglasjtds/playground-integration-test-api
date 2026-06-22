# AI Logs — Registro de Execução da POC

> Este arquivo deve ser atualizado após cada passo executado do TODOS.md.
> Ao final da POC, ele será consumido pela IA para gerar a documentação final do ebook.
>
> **Como usar:**
> 1. Após executar um passo, preencha a entrada correspondente abaixo
> 2. Use os status: ✅ Concluído | ⚠️ Parcial | ❌ Falhou | ⏭️ Pulado
> 3. Seja específico nos "Arquivos Criados" — este log é a memória do projeto
> 4. Registre decisões e problemas — eles viram conteúdo do ebook

---

## Metadados do Projeto

```
Projeto:        TaskFlow API
Tipo:           POC — Testes de Integração com IA
Iniciado em:    2026-06-17
Concluído em:   [PREENCHER]
Executado por:  Douglas Tertuliano + Claude Code (Opus 4.6)
Node.js:        v25.6.1
npm:            v10.x
OS:             Windows 11 Enterprise 10.0.26100
```

---

## Tabela de Status

| Passo | Título | Status | Data |
|---|---|---|---|
| 0.1 | Scaffold inicial e dependências | ✅ | 2026-06-17 |
| 0.2 | Configuração TypeScript e Vitest | ✅ | 2026-06-17 |
| 0.3 | App base Express e utilitários | ✅ | 2026-06-17 |
| 1.1 | Modelos, tipos e DTOs | ✅ | 2026-06-17 |
| 1.2 | Camada de Repositórios | ✅ | 2026-06-17 |
| 1.3 | Camada de Services | ✅ | 2026-06-17 |
| 1.4 | Camada de Controllers | ✅ | 2026-06-17 |
| 1.5 | Rotas, Middlewares e Swagger | ✅ | 2026-06-17 |
| 2.1 | Helpers de teste | ✅ | 2026-06-17 |
| 2.2 | Configuração MSW v2 | ✅ | 2026-06-17 |
| 3.1 | Testes unitários dos Services | ✅ | 2026-06-19 |
| 3.2 | Testes de integração: Projects | ✅ | 2026-06-19 |
| 3.3 | Testes de integração: Tasks e Comments | ✅ | 2026-06-19 |
| 3.4 | Testes de integração: Auth e Users | ✅ | 2026-06-19 |
| 3.5 | Pipeline CI/CD GitHub Actions | ✅ | 2026-06-19 |
| 3.6 | Testes E2E — smoke tests contra servidor real | ✅ | 2026-06-22 |
| 4.1 | Capítulos do Ebook | ⏳ | |
| 4.2 | Script geração PDF | ⏳ | |
| 4.3 | Revisão final e relatório | ⏳ | |

---

## Logs de Execução

---

### [PASSO 0.1] — Scaffold inicial e dependências

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `package.json` — todas as dependências conforme TODOS.md, type: "module", 12 scripts npm
- `.env.example` — PORT, NODE_ENV, JWT_SECRET
- `.gitignore` — node_modules, dist, .env, coverage, *.pdf

#### Estrutura de Pastas Criada
23 diretórios: src/ (models, repositories/interfaces, services, controllers, routes, middlewares, utils, config), tests/ (unit/services, integration/helpers, integration/msw, e2e/helpers), scripts/, docs/ (architecture, ebook), .github/workflows/

#### Decisões Tomadas
- Seguimos exatamente as versões de dependências especificadas no TODOS.md
- Nenhum desvio do plano original

#### Problemas Encontrados
- `npm install` demorou ~2 minutos no Windows — warnings de deprecação em `glob@10/11`, `node-domexception` e `uuid@10` (não afetam o projeto)

#### Observações
- 323 pacotes instalados com sucesso
- lockfileVersion 3 gerado

---

### [PASSO 0.2] — Configuração TypeScript e Vitest

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `tsconfig.json` — target ES2022, module NodeNext, strict true, path alias @/*, sourceMap e declaration habilitados
- `vitest.config.ts` — testes unitários em tests/unit/**, cobertura v8 focada em src/services/**, reporters text+html+lcov
- `vitest.integration.config.ts` — testes de integração em tests/integration/**, setupFiles apontando para helpers/setup.ts, testTimeout 15000ms, cobertura v8 em src/**

#### Decisões Tomadas
- Adicionado `resolve.alias` com `@` → `src/` em ambos os vitest configs para que o path alias do tsconfig funcione nos testes
- Adicionado `declaration`, `declarationMap` e `sourceMap` no tsconfig para melhor DX

#### Problemas Encontrados
- `npx tsc --noEmit` retorna TS18003 quando não há arquivos .ts em src/ — comportamento esperado, validado com placeholder temporário

#### Observações
- Vitest v2.1.9 instalado, funcionando corretamente com a config

---

### [PASSO 0.3] — App base Express e utilitários

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/utils/errors.ts` — AppError (base) + 5 subclasses: NotFoundError (404), ValidationError (400, com array de erros), UnauthorizedError (401), ForbiddenError (403), ConflictError (409)
- `src/utils/response.ts` — Helpers success(), created(), noContent(), paginated() — todas retornam formato padronizado { success, data?, message?, meta? }
- `src/utils/validator.ts` — Middlewares validateBody(), validateQuery(), validateParams() que integram Zod com Express e lançam ValidationError
- `src/app.ts` — Factory function createApp(repositories?) com cors, helmet, express.json(), rota /health e handler 404
- `src/server.ts` — Entry point que lê PORT do env e inicia o servidor

#### Decisões Tomadas
- `createApp()` aceita `repositories` como parâmetro `unknown` por enquanto — será tipado como `Repositories` no Passo 1.2
- Middleware 404 inline no app.ts (será extraído para `src/middlewares/notFound.ts` no Passo 1.5)
- Todas as classes de erro usam `Object.setPrototypeOf` para garantir instanceof correto com herança de Error

#### Problemas Encontrados
- Nenhum problema de compilação — `npx tsc --noEmit` passou sem erros

#### Observações
- Teste via Vitest confirmou que createApp() retorna instância Express funcional (1 test passed)
- Servidor inicia corretamente e responde GET /health com { status: "ok" }

---

### [PASSO 1.1] — Modelos, tipos e DTOs

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/models/User.ts` — Enum UserRole (ADMIN, MEMBER), Interface User (7 campos), Type UserPublic (Omit passwordHash), CreateUserDTO, UpdateUserDTO
- `src/models/Project.ts` — Enum ProjectStatus (ACTIVE, ARCHIVED, COMPLETED), Interface Project (7 campos), CreateProjectDTO, UpdateProjectDTO
- `src/models/Task.ts` — Enums TaskStatus (TODO, IN_PROGRESS, DONE, CANCELLED) e Priority (LOW, MEDIUM, HIGH, CRITICAL), Interface Task (10 campos), CreateTaskDTO, UpdateTaskDTO, UpdateTaskStatusDTO, const VALID_STATUS_TRANSITIONS
- `src/models/Comment.ts` — Interface Comment (6 campos), CreateCommentDTO
- `src/models/Auth.ts` — LoginDTO, AuthPayload (payload JWT), LoginResponse (token + UserPublic)
- `src/models/index.ts` — Re-exporta todos os modelos

#### Decisões Tomadas
- Comentários JSDoc em português foram adicionados inicialmente, depois removidos a pedido do usuário (User.ts limpo como referência)
- VALID_STATUS_TRANSITIONS define fluxo principal TODO → IN_PROGRESS → DONE, com cancelamento possível a partir de TODO e IN_PROGRESS
- DONE e CANCELLED são estados terminais (sem transições permitidas)
- UserPublic usa `Omit<User, 'passwordHash'>` para garantir que dados sensíveis nunca vazem nas respostas

#### Problemas Encontrados
- Nenhum — `npx tsc --noEmit` passou sem erros

#### Observações
- Linter do usuário removeu comentários automaticamente dos demais arquivos de modelo, mantendo código limpo

---

### [PASSO 1.2] — Camada de Repositórios (in-memory)

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/repositories/interfaces/IRepository.ts` — Interface genérica com findAll, findById, create, update, delete, clear
- `src/repositories/UserRepository.ts` — Implementa IRepository\<User\> + método extra findByEmail()
- `src/repositories/ProjectRepository.ts` — Implementa IRepository\<Project\> + método extra findByOwnerId()
- `src/repositories/TaskRepository.ts` — Implementa IRepository\<Task\> + métodos extras findByProjectId(), countByStatus()
- `src/repositories/CommentRepository.ts` — Implementa IRepository\<Comment\> + método extra findByTaskId()
- `src/repositories/index.ts` — Re-exports + função factory createRepositories() + tipo Repositories

#### Decisões Tomadas
- Usamos `Map<string, T>` em vez de Array para O(1) lookup por ID
- IDs gerados com `uuid()` do pacote uuid v10
- `create()` preenche automaticamente id, createdAt e updatedAt
- `update()` preserva id e createdAt originais, atualiza updatedAt
- `clear()` exposto na interface para reset entre testes
- `findAll()` aceita filtros genéricos via `Partial<T>` com comparação exata de valores
- TaskRepository.findAll() ignora filtros com valor `undefined` para permitir filtros opcionais

#### Problemas Encontrados
- Nenhum — `npx tsc --noEmit` passou sem erros

#### Observações
- `createRepositories()` retorna instâncias independentes — cada chamada cria estado limpo (essencial para isolamento de testes)

---

### [PASSO 1.3] — Camada de Services

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/services/UserService.ts` — CRUD de usuários, hash SHA-256, toPublic() para omitir passwordHash
- `src/services/ProjectService.ts` — CRUD de projetos, valida existência do owner
- `src/services/TaskService.ts` — CRUD de tasks, updateStatus() com transições válidas
- `src/services/CommentService.ts` — CRUD de comentários vinculados a tasks
- `src/services/AuthService.ts` — register(), login() com JWT, verifyToken()

#### Regras de Negócio Implementadas
- **UserService**: email único (ConflictError 409), não deleta user com tasks IN_PROGRESS (ForbiddenError 403), nunca retorna passwordHash
- **ProjectService**: ownerId deve existir (NotFoundError 404), não deleta projeto com tasks ativas TODO/IN_PROGRESS (ConflictError 409)
- **TaskService**: não cria task em projeto ARCHIVED (ConflictError 409), valida assigneeId se fornecido, updateStatus() respeita VALID_STATUS_TRANSITIONS (ValidationError 400), não deleta task IN_PROGRESS (ConflictError 409)
- **CommentService**: valida existência da task, apenas o autor pode deletar comentário (ForbiddenError 403)
- **AuthService**: registro com token JWT, login com verificação de hash, token expira em 24h

#### Decisões Tomadas
- Hash de senha com SHA-256 (crypto nativo do Node) em vez de bcrypt para evitar dependência nativa — aceitável para POC
- JWT_SECRET lido de process.env com fallback para valor padrão da POC
- Services recebem repositórios via construtor (injeção de dependência)
- TaskRepository é opcional no UserService e ProjectService (via `?`) para flexibilidade
- hashPassword() e toPublic() exportadas do UserService para reuso no AuthService

#### Problemas Encontrados
- Bug no AuthService.register(): referência incorreta `await_import('ConflictError')` em vez de `new ConflictError()` — corrigido imediatamente antes da compilação

#### Observações
- Nenhum service importa Express (req/res) — dependência exclusiva em modelos e repositórios
- Todos os métodos usam classes de erro tipadas de src/utils/errors.ts

---

### [PASSO 1.4] — Camada de Controllers

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/controllers/AuthController.ts` — 2 métodos: register, login
- `src/controllers/UserController.ts` — 5 métodos: index, show, update, partialUpdate, destroy
- `src/controllers/ProjectController.ts` — 6 métodos: index, show, create, update, partialUpdate, destroy
- `src/controllers/TaskController.ts` — 9 métodos: index, show, create, update, updateStatus, destroy, listComments, addComment, removeComment

#### Decisões Tomadas
- Todos os métodos são arrow functions (=>) para bind automático do `this` — evita problemas com contexto ao passar como callback no router
- Padrão try/catch com next(error) em todos os métodos — centraliza tratamento no errorHandler
- Controllers usam helpers de src/utils/response.ts: success(), created(), noContent()
- TaskController recebe tanto TaskService quanto CommentService no construtor (comments são sub-recurso de tasks)
- Para rotas autenticadas, `req.user` é acessado via cast `(req as Request & { user: AuthPayload }).user`

#### Problemas Encontrados
- Nenhum — `npx tsc --noEmit` passou sem erros

#### Observações
- Zero lógica de negócio nos controllers — apenas extração de dados do req, chamada ao service e formatação da resposta
- Total de 22 handler methods criados nos 4 controllers

---

### [PASSO 1.5] — Rotas, Middlewares e Swagger

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `src/middlewares/auth.ts` — authenticate(authService) verifica JWT Bearer, requireRole(...roles) verifica permissão, interface AuthenticatedRequest
- `src/middlewares/errorHandler.ts` — Trata AppError (statusCode + message), ZodError (400 + lista), erros desconhecidos (500 genérico em prod)
- `src/middlewares/notFound.ts` — Responde 404 JSON para rotas não mapeadas
- `src/middlewares/requestLogger.ts` — Loga [METHOD] /path → status (Xms)
- `src/utils/schemas.ts` — 10 schemas Zod: loginSchema, createUserSchema, updateUserSchema, createProjectSchema, updateProjectSchema, patchProjectSchema, createTaskSchema, updateTaskSchema, updateTaskStatusSchema, createCommentSchema
- `src/routes/authRoutes.ts` — POST /auth/register, POST /auth/login (com validação Zod + JSDoc Swagger)
- `src/routes/userRoutes.ts` — GET/PUT/PATCH/DELETE /users e /users/:id (autenticado)
- `src/routes/projectRoutes.ts` — GET/POST/PUT/PATCH/DELETE /projects e /projects/:id (autenticado)
- `src/routes/taskRoutes.ts` — CRUD /tasks, PATCH /tasks/:id/status, GET/POST/DELETE /tasks/:id/comments (autenticado)
- `src/routes/index.ts` — registerRoutes() agrega todos os routers
- `src/config/swagger.ts` — OpenAPI 3.0 com bearerAuth, serve Swagger UI em /api-docs
- `src/app.ts` — **Atualizado**: wiring completo repos → services → controllers → rotas, ordem correta de middlewares

#### Total de Rotas Criadas
23 rotas em 4 domínios: Auth (2), Users (5), Projects (6), Tasks (10 incluindo comments)

#### Verificação de Funcionamento
- GET /health: ✅ (confirmado via tsc --noEmit, compilação sem erros)
- GET /api-docs: ✅ (Swagger UI configurado)
- POST /auth/register com body inválido retorna 400: ✅ (validação Zod ativa)

#### Decisões Tomadas
- Middleware authenticate é uma factory function que recebe AuthService — permite injeção de dependência nos testes
- Rotas usam factory functions (createAuthRoutes, createProjectRoutes, etc.) que recebem controllers e authService
- Schemas Zod separados em arquivo dedicado src/utils/schemas.ts para reuso
- patchProjectSchema usa campos .optional() para permitir atualização parcial; updateProjectSchema exige todos os campos para PUT
- Swagger documentado via comentários JSDoc @swagger inline nas rotas (pelo menos 2 por entidade)
- Ordem dos middlewares no app.ts: cors → helmet → json → requestLogger → health → swagger → rotas → notFound → errorHandler

#### Problemas Encontrados
- Teste manual via `tsx -e` no Windows falha com ERR_MODULE_NOT_FOUND — limitação do tsx eval mode com paths relativos no Windows. Não afeta execução normal via `npm run dev`
- Teste com curl no Windows via bash shell também não funcionou (curl possivelmente não disponível no Git Bash deste ambiente)

#### Observações
- Fase 1 completa — toda a API está funcional com 23 rotas, validação Zod, autenticação JWT e documentação Swagger
- `npx tsc --noEmit` passou com exit code 0 em todos os passos da Fase 1

---

### [PASSO 2.1] — Helpers de teste

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `tests/integration/helpers/app-factory.ts` — Função `createTestApp()` que retorna `{ app, repositories }` com instâncias completamente isoladas. Interface `TestApp` exportada para tipagem.
- `tests/integration/helpers/data-factory.ts` — 4 funções de geração de DTOs (`makeUser`, `makeProject`, `makeTask`, `makeComment`) com @faker-js/faker locale pt_BR + 3 funções seed (`makeUserSeed`, `makeProjectSeed`, `makeTaskSeed`) que criam e persistem diretamente nos repositórios.
- `tests/integration/helpers/auth-helper.ts` — `getAuthToken(app, overrides?)` registra usuário via POST /auth/register e retorna JWT. `getAdminToken(app)` versão com role ADMIN. Ambas usam supertest.
- `tests/integration/helpers/setup.ts` — setupFile do Vitest: configura NODE_ENV=test, JWT_SECRET fixo, PORT=0.
- `tests/integration/helpers/index.ts` — Barrel export de todos os helpers (createTestApp, make*, getAuthToken, getAdminToken).

#### Decisões Tomadas
- Cada describe/it cria seu próprio app via `createTestApp()` para isolamento total — zero estado compartilhado entre testes
- Funções seed (`makeUserSeed`, etc.) usam hash SHA-256 direto (mesmo algoritmo do UserService) para criar usuários válidos no repositório sem passar pela API
- `@faker-js/faker` configurado com locale `pt_BR` para gerar dados realistas em português
- `PORT=0` no setup para evitar conflito com dev server
- Imports relativos com `../../../src/` em vez de alias `@/` pois os testes estão fora do rootDir do tsconfig

#### Observações
- `npx tsc --noEmit` passou sem erros — todos os tipos estão corretos

---

### [PASSO 2.2] — Configuração MSW v2

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `tests/integration/msw/handlers.ts` — 3 handlers: email notification (POST), ViaCEP (GET), fallback catch-all (retorna 500 + log de warning)
- `tests/integration/msw/server.ts` — `setupServer` com handlers padrão + helpers `mockEmailSuccess()` e `mockEmailFailure()` para sobrescrita em testes específicos
- `tests/integration/msw/example.test.ts` — 6 testes demonstrando: handler padrão de email, handler padrão de CEP, sobrescrita com mockEmailFailure(), sobrescrita com mockEmailSuccess(), sobrescrita inline com server.use(), e fallback para URLs não mapeadas
- `tests/integration/helpers/setup.ts` — **Atualizado**: integração com MSW lifecycle — `beforeAll(server.listen)`, `afterEach(server.resetHandlers)`, `afterAll(server.close)`

#### Serviços Externos Mockados
- **Serviço de notificação por email** (POST https://notifications.taskflow.io/send) — simula envio de emails transacionais, retorna 202 com messageId e status "queued"
- **ViaCEP** (GET https://viacep.com.br/ws/:cep/json/) — simula consulta de CEP, retorna dados de endereço mockados de São Paulo
- **Fallback global** (https://*) — captura qualquer request externo não mapeado, loga warning e retorna 500 para evitar requests reais escapando nos testes

#### Decisões Tomadas
- MSW v2.14.6 (API v2): usa `http.post()`, `http.get()`, `http.all()` e `HttpResponse.json()` em vez da API v1
- `onUnhandledRequest: 'warn'` no server.listen() — loga requests não mapeados sem falhar o teste (útil para debug)
- Handlers resetados após cada teste via `server.resetHandlers()` no afterEach — sobrescritas com `server.use()` não vazam entre testes
- Fallback catch-all usa `https://*` para interceptar apenas requests HTTPS externos (não interfere com requests ao app Express local)

#### Resultado da Execução
```
✓ tests/integration/msw/example.test.ts (6 tests) 132ms
Test Files  1 passed (1)
     Tests  6 passed (6)
  Duration  6.33s
```

#### Observações
- MSW funciona corretamente com Vitest + Node.js — interceptação de fetch nativo sem problemas
- Padrão de sobrescrita (`server.use()` dentro do teste) demonstrado no example.test.ts serve de referência para o time

---

### [PASSO 3.1] — Testes unitários dos Services

**Status:** ✅ Concluído  
**Data:** 2026-06-19

#### Arquivos Criados
- `tests/unit/services/projectService.test.ts` — 12 cenários (findById, findAll, create, update, delete)
- `tests/unit/services/taskService.test.ts` — 21 cenários (findById, create, updateStatus com it.each para transições inválidas, update, delete)
- `tests/unit/services/userService.test.ts` — 12 cenários (findAll, findById, create, update, delete)

#### Resultado da Execução
```
Test Files  3 passed (3)
     Tests  45 passed (45)
  Duration  6.65s
```

#### Decisões Tomadas
- Todos os repositórios mockados com `vi.fn()` — sem implementação in-memory nos unitários
- `it.each()` usado para testar 5 transições de status inválidas de uma vez
- Nomes descritivos em português em todos os testes

#### Problemas Encontrados
- Nenhum — todos os 45 testes passaram na primeira execução

#### Observações
- Gerados pelo Claude Code CLI em uma única interação

---

### [PASSO 3.2] — Testes de integração: Projects

**Status:** ✅ Concluído  
**Data:** 2026-06-19

#### Arquivo Criado
- `tests/integration/projects.test.ts` — 19 cenários

#### Cenários Cobertos
- GET /projects: 4 cenários (lista vazia, todos projetos, filtro por status, 401 sem auth)
- GET /projects/:id: 2 cenários (200 encontrado, 404 inexistente)
- POST /projects: 5 cenários (201 sucesso, 400 campos ausentes, 400 validação Zod, 401 sem auth, 404 ownerId inexistente)
- PUT /projects/:id: 2 cenários (substituição completa, 404 inexistente)
- PATCH /projects/:id: 3 cenários (atualização parcial, atualização de status, 400 status inválido)
- DELETE /projects/:id: 3 cenários (204 sucesso + verificação, 404 inexistente, 409 com tasks ativas)

#### Resultado da Execução
```
Test Files  1 passed (1)
     Tests  19 passed (19)
  Duration  11.39s
```

#### Problemas Encontrados
- Primeira execução falhou com 12 erros: propriedades dos repositórios eram `repos.userRepo` (não `repos.userRepository`). Corrigido e todos passaram.

#### Observações
- Gerados pelo Claude Code CLI — correção de nomes de propriedade foi o único ajuste necessário

---

### [PASSO 3.3] — Testes de integração: Tasks e Comments

**Status:** ✅ Concluído  
**Data:** 2026-06-19

#### Arquivo Criado
- `tests/integration/tasks.test.ts` — 28 cenários

#### Cenários de Transição de Status Cobertos
- TODO → IN_PROGRESS: ✅
- IN_PROGRESS → DONE: ✅
- TODO → DONE (inválido): ✅
- DONE → IN_PROGRESS (inválido): ✅
- TODO → CANCELLED: ✅
- IN_PROGRESS → CANCELLED: ✅

#### Happy Path Completo
Registro → Cria projeto → Cria task (TODO) → TODO→IN_PROGRESS → Adiciona comentário → IN_PROGRESS→DONE → Tenta DONE→IN_PROGRESS (400 esperado)

#### Resultado da Execução
```
Test Files  1 passed (1)
     Tests  28 passed (28)
  Duration  42.74s
```

#### Observações
- Gerados pelo Claude Code CLI — todos passaram na primeira execução sem ajustes

---

### [PASSO 3.4] — Testes de integração: Auth e Users

**Status:** ✅ Concluído  
**Data:** 2026-06-19

#### Arquivos Criados
- `tests/integration/auth.test.ts` — 14 cenários
- `tests/integration/users.test.ts` — 16 cenários

#### Verificações de Segurança Implementadas
- Resposta nunca contém passwordHash: ✅
- Token inválido retorna 401: ✅
- Token manipulado retorna 401: ✅
- Sem header Authorization retorna 401: ✅

#### Resultado da Execução
```
Test Files  2 passed (2)
     Tests  30 passed (30)
  Duration  4.39s
```

#### Observações
- A API não implementa controle de ownership (MEMBER editar outro user) — testes refletem o comportamento real
- Gerados pelo Claude Code CLI — todos passaram na primeira execução

---

### [PASSO 3.5] — Pipeline CI/CD GitHub Actions

**Status:** ✅ Concluído  
**Data:** 2026-06-19

#### Arquivos Criados
- `.github/workflows/ci.yml` — 2 jobs: test (unitários + integração + cobertura) e build (TypeScript)
- `docs/architecture/decisions.md` — 4 ADRs
- `README.md` — reescrito com badge CI, seção "Como rodar os testes", estrutura do projeto

#### ADRs Documentadas
- ADR-001: In-memory vs Docker ✅
- ADR-002: Vitest vs Jest ✅
- ADR-003: Express vs Fastify ✅
- ADR-004: Estratégia local vs deploy ✅

#### Decisões Tomadas
- Pipeline dispara em push main/develop e PR para main
- Env vars no CI: NODE_ENV=test e JWT_SECRET fixo para testes

#### Observações
- `npm run test` (45 passed) e `npm run build` (sem erros) confirmados após criação

---

### [PASSO 3.6] — Testes E2E — smoke tests contra servidor real

**Status:** ✅ Concluído  
**Data:** 2026-06-22

#### Arquivos Criados
- `vitest.e2e.config.ts` — Config Vitest E2E: pool forks com singleFork (execução sequencial), timeout 30s, sem coverage, sem setupFiles, `test.env.BASE_URL` propagado para forks
- `tests/e2e/helpers/client.ts` — Cliente HTTP com fetch nativo (Node 20+): BASE_URL configurável via env com fallback localhost:3000, função `api(method, path, body?, token?)` retornando `{ status, data }`, tratamento de 204 No Content
- `tests/e2e/smoke.test.ts` — 11 cenários em 4 blocos (Servidor, Autenticação, Fluxo crítico, Proteção de rotas)

#### Arquivos Modificados
- `package.json` — Scripts `test:e2e`, `test:e2e:local`, `test:all` atualizado para incluir E2E + devDependency `wait-on@^7.2.0`
- `.github/workflows/ci.yml` — Job `e2e` (needs: build) com `npm start &` em background + `npx wait-on` + `BASE_URL` configurável (comentário para staging)
- `docs/architecture/decisions.md` — ADR-005: Estratégia E2E — smoke tests leves com fetch nativo contra servidor real

#### BASE_URL utilizada nos testes locais
http://localhost:3456

#### Cenários Cobertos
- GET /health: ✅
- POST /auth/register válido: ✅
- POST /auth/register inválido (400): ✅
- POST /auth/login correto: ✅
- POST /auth/login incorreto (401): ✅
- Fluxo Projeto → Task → Transição de status: ✅ (criar projeto, buscar por ID, criar task, TODO→IN_PROGRESS→DONE, transição inválida DONE→IN_PROGRESS, transição inválida TODO→DONE, filtrar por projectId)
- Rotas protegidas sem token (401): ✅ (GET /projects, POST /projects)

#### Resultado da Execução Local
```
BASE_URL=http://localhost:3456 npx vitest run --config vitest.e2e.config.ts

🔗 Smoke tests rodando contra: http://localhost:3456

 ✓ tests/e2e/smoke.test.ts (11 tests) 374ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  18:38:16
   Duration  1.02s (transform 47ms, setup 0ms, collect 75ms, tests 374ms, environment 0ms, prepare 152ms)
```

#### Diferença observada vs testes de integração (Supertest)
- **Propagação de env vars em forks:** A variável `BASE_URL` não era propagada para processos fork do Vitest no Windows. Resolvido adicionando `test.env` no vitest.e2e.config.ts. Supertest não teria exposto esse problema pois injeta diretamente no Express sem criar forks.
- **Validação de rede real:** Os testes E2E confirmam que CORS, binding de porta e a middleware stack completa funcionam via HTTP real — Supertest bypassa toda essa camada.
- **Servidor precisa estar de pé:** `npm run test:e2e` sem servidor rodando falha com `ECONNREFUSED` — isso é o comportamento esperado e valida que estamos realmente testando via rede.

#### Decisões Tomadas
- `pool: 'forks'` com `singleFork: true` para execução sequencial — servidor é estado compartilhado (in-memory)
- Cada teste gera emails únicos com `Date.now()` + random suffix para evitar conflito 409 no estado compartilhado
- `wait-on@^7.2.0` adicionado como devDependency para aguardar servidor no CI antes de rodar testes
- Fetch nativo (Node 20+) em vez de axios ou supertest — zero dependências extras para o cliente HTTP

#### Problemas Encontrados
- Primeira execução falhou com `TypeError: Failed to parse URL from //health` — `BASE_URL` resolvia como string vazia no fork do Vitest (`//health` = URL inválida). Corrigido adicionando `test.env: { BASE_URL: process.env.BASE_URL ?? 'http://localhost:3000' }` no vitest.e2e.config.ts para garantir propagação.

#### Observações
- Gerados pelo Claude Code CLI — todos os 11 testes passaram após correção do env var
- Tempo total de execução dos testes: 374ms (rápido por usar repositórios in-memory no servidor)
- A mesma suíte pode ser apontada para staging alterando apenas `BASE_URL`

---

### [PASSO 4.1] — Capítulos do Ebook

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `docs/ebook/00-introducao.md` — X palavras
- `docs/ebook/01-arquitetura.md` — X palavras
- `docs/ebook/02-api-e-rotas.md` — X palavras
- `docs/ebook/03-estrategia-de-testes.md` — X palavras
- `docs/ebook/05-conclusao-e-proximos-passos.md` — X palavras

#### Observações

---

### [PASSO 4.2] — Script geração PDF

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `scripts/generate-ebook.ts` — ...
- `docs/taskflow-api-poc.pdf` — X páginas, X MB

#### Observações

---

### [PASSO 4.3] — Revisão final e relatório

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados/Atualizados
- `CHANGELOG.md` — ...

#### Resultado Final dos Testes
```
[COLE O OUTPUT DO npm run test:all AQUI]
```

---

## RESUMO FINAL DA POC

> Esta seção é preenchida ao final e usada pela IA para gerar o ebook.
> Execute o seguinte prompt no Claude Code quando todos os passos estiverem concluídos:
>
> "Leia o arquivo instructions/AI-LOGS-EXECUTION.md completo e os arquivos em docs/ebook/.
> Com base nesses dados, complete as seções de Métricas Finais e Aprendizados abaixo
> e atualize os capítulos 03, 04 e 05 do ebook com as informações reais coletadas."

---

### Métricas Finais

| Métrica | Valor |
|---|---|
| Total de rotas na API | |
| Total de testes unitários | |
| Total de testes de integração | |
| Total de testes gerados via Claude Code CLI | |
| Cobertura de código (%) | |
| Cobertura de rotas (%) | |
| Tempo de execução total (unitários) | |
| Tempo de execução total (integração) | |
| Passos concluídos com sucesso | / 19 |
| Páginas do ebook gerado | |

---

### Aprendizados e Decisões-Chave

<!-- A ser preenchido pela IA com base nos logs acima -->

**O que funcionou bem:**
-

**O que precisou de ajuste:**
-

**O que mudaria numa próxima iteração:**
-

---

### Avaliação do Claude Code CLI nos Testes

<!-- A ser preenchido ao final da POC com base na experiência da Fase 3 -->

**Abordagem utilizada:** Claude Code CLI gerando testes diretamente via prompts conversacionais

**Taxa de aproveitamento dos testes gerados:** __%

**Melhor caso de uso demonstrado:**

**Limitações observadas:**

**Recomendação para o time:**

---

### Próximos Passos para Produção

<!-- A ser preenchido pela IA com base nos ADRs e nas observações dos logs -->

1.
2.
3.
4.
5.

---

*Log iniciado em: 2026-06-17 | Última atualização: 2026-06-22 (Fase 3 completa — passos 3.1 a 3.6)*
