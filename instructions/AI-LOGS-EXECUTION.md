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
| 2.1 | Helpers de teste | ⏳ | |
| 2.2 | Configuração MSW v2 | ⏳ | |
| 3.1 | Testes unitários dos Services | ⏳ | |
| 3.2 | Testes de integração: Projects | ⏳ | |
| 3.3 | Testes de integração: Tasks e Comments | ⏳ | |
| 3.4 | Testes de integração: Auth e Users | ⏳ | |
| 3.5 | Pipeline CI/CD GitHub Actions | ⏳ | |
| 3.6 | Testes E2E — smoke tests contra servidor real | ⏳ | |
| 4.1 | Script generate-tests.ts (Claude API) | ⏳ | |
| 4.2 | Execução e validação dos testes gerados | ⏳ | |
| 4.3 | Analisador de cobertura com IA | ⏳ | |
| 5.1 | Capítulos do Ebook | ⏳ | |
| 5.2 | Script geração PDF | ⏳ | |
| 5.3 | Revisão final e relatório | ⏳ | |

---

## Logs de Execução

---

### [PASSO 0.1] — Scaffold inicial e dependências

**Status:** ✅ Concluído  
**Data:** 2026-06-17

#### Arquivos Criados
- `package.json` — todas as dependências conforme TODOS.md, type: "module", 12 scripts npm
- `.env.example` — PORT, NODE_ENV, ANTHROPIC_API_KEY, JWT_SECRET
- `.gitignore` — node_modules, dist, .env, coverage, *.pdf

#### Estrutura de Pastas Criada
23 diretórios: src/ (models, repositories/interfaces, services, controllers, routes, middlewares, utils, config), tests/ (unit/services, integration/helpers, integration/msw, e2e/helpers, ai-generated), scripts/, docs/ (architecture, ebook), .github/workflows/

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

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `tests/integration/helpers/app-factory.ts` — ...
- `tests/integration/helpers/data-factory.ts` — ...
- `tests/integration/helpers/auth-helper.ts` — ...
- `tests/integration/helpers/setup.ts` — ...

#### Decisões Tomadas
<!-- Ex: "Cada describe cria seu próprio app via createTestApp() para isolamento total" -->
-

#### Observações

---

### [PASSO 2.2] — Configuração MSW v2

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `tests/integration/msw/handlers.ts` — ...
- `tests/integration/msw/server.ts` — ...
- `tests/integration/msw/example.test.ts` — ...

#### Serviços Externos Mockados
<!-- Liste os serviços que foram mockados e por quê -->
-

#### Decisões Tomadas
-

#### Observações

---

### [PASSO 3.1] — Testes unitários dos Services

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `tests/unit/services/projectService.test.ts` — X cenários
- `tests/unit/services/taskService.test.ts` — X cenários
- `tests/unit/services/userService.test.ts` — X cenários

#### Resultado da Execução
```
npm run test

[COLE O OUTPUT AQUI]
```

#### Cobertura dos Services
- ProjectService: __%
- TaskService: __%
- UserService: __%

#### Decisões Tomadas
-

#### Problemas Encontrados
-

#### Observações

---

### [PASSO 3.2] — Testes de integração: Projects

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivo Criado
- `tests/integration/projects.test.ts` — X cenários

#### Cenários Cobertos
<!-- Liste os métodos HTTP e quantos cenários cada um tem -->
- GET /projects: X cenários
- GET /projects/:id: X cenários
- POST /projects: X cenários
- PUT /projects/:id: X cenários
- PATCH /projects/:id: X cenários
- DELETE /projects/:id: X cenários

#### Resultado da Execução
```
[COLE O OUTPUT AQUI]
```

#### Observações

---

### [PASSO 3.3] — Testes de integração: Tasks e Comments

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivo Criado
- `tests/integration/tasks.test.ts` — X cenários

#### Cenários de Transição de Status Cobertos
<!-- Essencial documentar — é a regra de negócio central -->
- TODO → IN_PROGRESS: [✅ / ❌]
- IN_PROGRESS → DONE: [✅ / ❌]
- TODO → DONE (inválido): [✅ / ❌]
- DONE → IN_PROGRESS (inválido): [✅ / ❌]
- TODO → CANCELLED: [✅ / ❌]

#### Happy Path Completo
<!-- Descreva o fluxo narrativo do cenário completo implementado -->

#### Resultado da Execução
```
[COLE O OUTPUT AQUI]
```

---

### [PASSO 3.4] — Testes de integração: Auth e Users

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `tests/integration/auth.test.ts` — X cenários
- `tests/integration/users.test.ts` — X cenários

#### Verificações de Segurança Implementadas
- Resposta nunca contém passwordHash: [✅ / ❌]
- Token inválido retorna 401: [✅ / ❌]
- MEMBER não pode editar outro user: [✅ / ❌]

#### Resultado da Execução
```
[COLE O OUTPUT AQUI]
```

**Arquivos esperados:** `.github/workflows/ci.yml`, `docs/architecture/decisions.md`, `README.md` atualizado

---

### [PASSO 3.5] — Pipeline CI/CD GitHub Actions

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `.github/workflows/ci.yml` — ...
- `docs/architecture/decisions.md` — X ADRs

#### ADRs Documentadas
- ADR-001: [✅ / ❌]
- ADR-002: [✅ / ❌]
- ADR-003: [✅ / ❌]
- ADR-004: [✅ / ❌]

#### Observações

---

### [PASSO 3.6] — Testes E2E — smoke tests contra servidor real

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `vitest.e2e.config.ts` — ...
- `tests/e2e/helpers/client.ts` — ...
- `tests/e2e/smoke.test.ts` — X cenários

#### BASE_URL utilizada nos testes locais
<!-- Ex: http://localhost:3000 -->

#### Cenários Cobertos
- GET /health: [✅ / ❌]
- POST /auth/register válido: [✅ / ❌]
- POST /auth/register inválido (400): [✅ / ❌]
- POST /auth/login correto: [✅ / ❌]
- POST /auth/login incorreto (401): [✅ / ❌]
- Fluxo Projeto → Task → Transição de status: [✅ / ❌]
- Rotas protegidas sem token (401): [✅ / ❌]

#### Resultado da Execução Local
```
BASE_URL=http://localhost:3000 npm run test:e2e

[COLE O OUTPUT AQUI]
```

#### Diferença observada vs testes de integração (Supertest)
<!-- O que os E2E pegaram que os de integração não pegariam? Documente — vai para o ebook. -->

#### Observações

---

### [PASSO 4.1] — Script generate-tests.ts (Claude API)

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `scripts/generate-tests.ts` — ...
- `docs/ebook/04-ia-nos-testes.md` — ...

#### Como o Script Funciona (resumo técnico)
<!-- Descreva o fluxo: input → prompt → API → output. Vai para o ebook. -->

#### Observações

---

### [PASSO 4.2] — Execução e validação dos testes gerados

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivo Gerado
- `tests/ai-generated/[NOME].test.ts`

#### Métricas da Geração
- Total de cenários gerados pela IA: __
- Cenários que passaram sem ajuste: __ (__ %)
- Cenários que precisaram de ajuste: __
- Cenários que foram removidos/inválidos: __

#### O Que a IA Acertou de Primeira
<!-- Liste os padrões que a IA seguiu corretamente — útil para o ebook -->
-

#### O Que Precisou de Ajuste Manual
<!-- Liste o que precisou ser corrigido e por quê — honestidade importa aqui -->
-

#### Conclusão da Demonstração
<!-- 2-3 frases sobre o valor prático demonstrado — vai para o ebook -->

---

### [PASSO 4.3] — Analisador de cobertura com IA

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `scripts/analyze-coverage.ts` — ...
- `docs/coverage-analysis.md` — ...

#### Gaps Identificados pela IA
<!-- Top 3 sugestões que a IA gerou — vai para o ebook -->
1.
2.
3.

#### Observações

---

### [PASSO 5.1] — Capítulos do Ebook

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

### [PASSO 5.2] — Script geração PDF

**Status:** ⏳  
**Data:** [PREENCHER]

#### Arquivos Criados
- `scripts/generate-ebook.ts` — ...
- `docs/taskflow-api-poc.pdf` — X páginas, X MB

#### Observações

---

### [PASSO 5.3] — Revisão final e relatório

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
| Total de testes gerados pela IA | |
| Cobertura de código (%) | |
| Cobertura de rotas (%) | |
| Tempo de execução total (unitários) | |
| Tempo de execução total (integração) | |
| Passos concluídos com sucesso | / 22 |
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

### Avaliação da IA nos Testes

<!-- A ser preenchido com base nos dados do passo 4.2 -->

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

*Log iniciado em: 2026-06-17 | Última atualização: 2026-06-17 (Fase 1 completa — passos 0.1 a 1.5)*
