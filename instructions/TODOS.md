# TODOS — Prompts de Execução para o Claude Code

> Cada bloco abaixo é um prompt pronto para copiar e colar no Claude Code (Claude CLI).
> Execute os passos em ordem. Um passo por vez. Registre o resultado em `AI-LOGS-EXECUTION.md`.

---

## Configuração inicial: leia antes de começar

Antes de executar qualquer passo, cole este contexto no início da sua sessão do Claude Code:

```
Você está construindo a TaskFlow API — um sistema de gerenciamento de projetos e tarefas em Node.js + TypeScript + Express. O projeto segue arquitetura em 3 camadas: Controller → Service → Repository. Os testes são feitos com Vitest + Supertest sem Docker (repositórios in-memory). Leia o arquivo instructions/README.md para entender o escopo completo antes de executar qualquer tarefa.
```

---

## FASE 0 — Fundação do Projeto

### Passo 0.1 — Scaffold inicial e dependências

**Objetivo:** Criar a estrutura de pastas do projeto e o `package.json` com todas as dependências necessárias.

```
Crie o scaffold inicial do projeto TaskFlow API com as seguintes especificações:

1. Crie toda a estrutura de pastas conforme descrita em instructions/README.md (src/, tests/, scripts/, docs/, .github/workflows/)

2. Crie o package.json com:
   - name: "taskflow-api"
   - version: "1.0.0"
   - description: "POC de testes de integração com IA — TaskFlow API"
   - type: "module"
   - scripts:
     - "dev": "tsx watch src/server.ts"
     - "build": "tsc"
     - "start": "node dist/server.js"
     - "test": "vitest run"
     - "test:watch": "vitest"
     - "test:coverage": "vitest run --coverage"
     - "test:integration": "vitest run --config vitest.integration.config.ts"
     - "test:integration:watch": "vitest --config vitest.integration.config.ts"
     - "test:all": "npm run test && npm run test:integration"
     - "generate:tests": "tsx scripts/generate-tests.ts"
     - "generate:ebook": "tsx scripts/generate-ebook.ts"
   - dependencies: express@^4.19.0, zod@^3.23.0, cors@^2.8.5, helmet@^7.1.0, jsonwebtoken@^9.0.2, @anthropic-ai/sdk@^0.28.0, swagger-ui-express@^5.0.1, swagger-jsdoc@^6.2.8, uuid@^10.0.0
   - devDependencies: typescript@^5.5.0, @types/node@^20.0.0, @types/express@^4.17.21, @types/cors@^2.8.17, @types/jsonwebtoken@^9.0.6, @types/swagger-ui-express@^4.1.6, @types/swagger-jsdoc@^6.0.4, @types/uuid@^10.0.0, vitest@^2.0.0, @vitest/coverage-v8@^2.0.0, supertest@^7.0.0, @types/supertest@^6.0.2, msw@^2.3.0, @faker-js/faker@^9.0.0, tsx@^4.16.0, md-to-pdf@^5.2.4

3. Crie o .env.example:
   PORT=3000
   NODE_ENV=development
   ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
   JWT_SECRET=taskflow-secret-key-poc

4. Crie o .gitignore incluindo: node_modules, dist, .env, coverage, *.pdf gerado

5. Não instale as dependências ainda — apenas crie o package.json.

Após criar os arquivos, execute `npm install` para instalar as dependências.
```

**Arquivos esperados:** `package.json`, `.env.example`, `.gitignore`, toda a estrutura de pastas

---

### Passo 0.2 — Configuração TypeScript e Vitest

**Objetivo:** Configurar TypeScript strict mode, path aliases e as duas configs do Vitest (unitários e integração).

```
Configure o TypeScript e o Vitest para o projeto TaskFlow API:

1. Crie tsconfig.json com:
   - target: ES2022
   - module: NodeNext
   - moduleResolution: NodeNext
   - strict: true
   - outDir: ./dist
   - rootDir: ./src
   - esModuleInterop: true
   - skipLibCheck: true
   - resolveJsonModule: true
   - paths: { "@/*": ["./src/*"] }
   - exclude: ["node_modules", "dist", "tests"]

2. Crie vitest.config.ts (testes unitários):
   - include: ["tests/unit/**/*.test.ts"]
   - environment: "node"
   - globals: true
   - coverage com provider "v8", include em "src/services/**"
   - reporter: ["text", "html", "lcov"]

3. Crie vitest.integration.config.ts (testes de integração):
   - include: ["tests/integration/**/*.test.ts"]
   - environment: "node"
   - globals: true
   - setupFiles: ["tests/integration/helpers/setup.ts"] (arquivo que será criado depois)
   - testTimeout: 15000 (integração pode ser mais lenta)
   - coverage com provider "v8", include em "src/**"

4. Adicione um comentário de cabeçalho em cada arquivo explicando sua finalidade em português.
```

**Arquivos esperados:** `tsconfig.json`, `vitest.config.ts`, `vitest.integration.config.ts`

---

### Passo 0.3 — App base Express e utilitários fundamentais

**Objetivo:** Criar o `app.ts`, `server.ts` e os utilitários base que as próximas camadas vão usar.

```
Crie a base da aplicação Express e os utilitários fundamentais do TaskFlow API:

1. src/utils/errors.ts — Classes de erro customizadas:
   - AppError (base): message, statusCode, isOperational
   - NotFoundError (404)
   - ValidationError (400) com campo "errors: string[]"
   - UnauthorizedError (401)
   - ForbiddenError (403)
   - ConflictError (409) para duplicatas (ex: email já existe)
   - Todas devem estender AppError

2. src/utils/response.ts — Helpers para respostas padronizadas:
   - success(res, data, message?, statusCode=200)
   - created(res, data, message?)
   - noContent(res)
   - paginated(res, data, total, page, limit)
   Todas retornam o formato: { success: boolean, data?, message?, errors?, meta? }

3. src/utils/validator.ts — Wrapper Zod para Express:
   - validateBody<T>(schema: ZodSchema<T>) → middleware que valida req.body e lança ValidationError
   - validateQuery<T>(schema: ZodSchema<T>) → middleware que valida req.query
   - validateParams<T>(schema: ZodSchema<T>) → middleware que valida req.params

4. src/app.ts — Express factory function:
   - Aceita repositórios como parâmetro (para injeção em testes)
   - Configura: cors, helmet, express.json(), requestLogger
   - Registra todas as rotas (placeholder por enquanto: app.get('/health', ...))
   - Registra middleware de 404 e errorHandler no final
   - Exporta a função createApp(repositories?)

5. src/server.ts — Entry point:
   - Importa createApp, chama com repositórios padrão
   - Inicia o servidor na PORT do .env
   - Logs de inicialização em português

Todos os arquivos devem ter comentários JSDoc em português explicando cada função/classe.
```

**Arquivos esperados:** `src/utils/errors.ts`, `src/utils/response.ts`, `src/utils/validator.ts`, `src/app.ts`, `src/server.ts`

---

## FASE 1 — Construção da API

### Passo 1.1 — Modelos, tipos e DTOs

**Objetivo:** Definir todas as interfaces TypeScript, enums e DTOs que as demais camadas usarão.

```
Crie todos os modelos TypeScript do TaskFlow API em src/models/:

1. src/models/User.ts:
   - Interface User: id, name, email, passwordHash, role (ADMIN | MEMBER), createdAt, updatedAt
   - Interface UserPublic: User sem passwordHash (usado nas respostas da API)
   - DTO CreateUserDTO: name, email, password, role?
   - DTO UpdateUserDTO: Partial<Omit<CreateUserDTO, 'email'>>
   - Enum UserRole: ADMIN = 'ADMIN', MEMBER = 'MEMBER'

2. src/models/Project.ts:
   - Interface Project: id, name, description, status, ownerId, createdAt, updatedAt
   - DTO CreateProjectDTO: name, description, ownerId
   - DTO UpdateProjectDTO: Partial<CreateProjectDTO & { status: ProjectStatus }>
   - Enum ProjectStatus: ACTIVE = 'ACTIVE', ARCHIVED = 'ARCHIVED', COMPLETED = 'COMPLETED'

3. src/models/Task.ts:
   - Interface Task: id, projectId, title, description, status, priority, assigneeId?, createdAt, updatedAt
   - DTO CreateTaskDTO: projectId, title, description?, priority, assigneeId?
   - DTO UpdateTaskDTO: Partial<Omit<CreateTaskDTO, 'projectId'>>
   - DTO UpdateTaskStatusDTO: { status: TaskStatus }
   - Enum TaskStatus: TODO | IN_PROGRESS | DONE | CANCELLED
   - Enum Priority: LOW | MEDIUM | HIGH | CRITICAL
   - Const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> definindo quais transições são permitidas

4. src/models/Comment.ts:
   - Interface Comment: id, taskId, authorId, content, createdAt, updatedAt
   - DTO CreateCommentDTO: content

5. src/models/Auth.ts:
   - DTO LoginDTO: email, password
   - Interface AuthPayload: userId, email, role (payload do JWT)
   - Interface LoginResponse: token, user (UserPublic)

6. src/models/index.ts — re-exporta todos os modelos

Documente cada campo com JSDoc em português.
```

**Arquivos esperados:** `src/models/User.ts`, `Project.ts`, `Task.ts`, `Comment.ts`, `Auth.ts`, `index.ts`

---

### Passo 1.2 — Camada de Repositórios (in-memory)

**Objetivo:** Criar os repositórios in-memory que serão usados nos testes sem necessidade de banco externo.

```
Crie a camada de repositórios in-memory do TaskFlow API:

1. src/repositories/interfaces/IRepository.ts — Interface genérica:
   - findAll(filters?: Partial<T>): T[]
   - findById(id: string): T | undefined
   - create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T
   - update(id: string, data: Partial<T>): T | undefined
   - delete(id: string): boolean
   - clear(): void  ← usado para resetar estado entre testes

2. src/repositories/UserRepository.ts:
   - Implementa IRepository<User>
   - Armazena em private users: Map<string, User>
   - Método extra: findByEmail(email: string): User | undefined
   - create() gera id com uuid(), preenche createdAt/updatedAt automaticamente

3. src/repositories/ProjectRepository.ts:
   - Implementa IRepository<Project>
   - Armazena em private projects: Map<string, Project>
   - Método extra: findByOwnerId(ownerId: string): Project[]
   - findAll() aceita filtro por status

4. src/repositories/TaskRepository.ts:
   - Implementa IRepository<Task>
   - Armazena em private tasks: Map<string, Task>
   - findAll() aceita filtros: projectId?, status?, priority?, assigneeId?
   - Método extra: findByProjectId(projectId: string): Task[]
   - Método extra: countByStatus(projectId: string): Record<TaskStatus, number>

5. src/repositories/CommentRepository.ts:
   - Implementa IRepository<Comment>
   - findByTaskId(taskId: string): Comment[]

6. src/repositories/index.ts — exporta as classes e uma função createRepositories() que retorna instâncias novas de todos os repositórios (útil para testes)

Cada repositório deve ter comentários explicando cada método. O Map interno garante O(1) para buscas por ID.
```

**Arquivos esperados:** `src/repositories/interfaces/IRepository.ts` e os 4 repositórios + `index.ts`

---

### Passo 1.3 — Camada de Services

**Objetivo:** Implementar todas as regras de negócio na camada de services com injeção de dependência.

```
Crie a camada de services do TaskFlow API. Cada service recebe os repositórios via construtor (injeção de dependência) e não importa nada do Express (sem req/res):

1. src/services/UserService.ts:
   - constructor(private userRepo: UserRepository)
   - findAll(): UserPublic[]  ← nunca retorna passwordHash
   - findById(id: string): UserPublic  ← lança NotFoundError se não existir
   - create(data: CreateUserDTO): UserPublic  ← lança ConflictError se email já existe, faz hash simples da senha (sha256 ou similar sem bcrypt para evitar dependência)
   - update(id: string, data: UpdateUserDTO): UserPublic
   - delete(id: string): void  ← lança ForbiddenError se user tem tasks IN_PROGRESS

2. src/services/ProjectService.ts:
   - constructor(private projectRepo: ProjectRepository, private userRepo: UserRepository)
   - findAll(filters?: { status?: ProjectStatus }): Project[]
   - findById(id: string): Project  ← lança NotFoundError
   - create(data: CreateProjectDTO): Project  ← valida que ownerId existe
   - update(id: string, data: UpdateProjectDTO): Project
   - delete(id: string): void  ← lança ConflictError se projeto tem tasks ativas

3. src/services/TaskService.ts:
   - constructor(private taskRepo: TaskRepository, private projectRepo: ProjectRepository, private userRepo: UserRepository)
   - findAll(filters?): Task[]
   - findById(id: string): Task
   - create(data: CreateTaskDTO): Task  ← valida que projeto existe e não está ARCHIVED
   - update(id: string, data: UpdateTaskDTO): Task
   - updateStatus(id: string, newStatus: TaskStatus): Task  ← valida transição usando VALID_STATUS_TRANSITIONS
   - delete(id: string): void  ← lança ConflictError se status é IN_PROGRESS

4. src/services/CommentService.ts:
   - constructor(private commentRepo: CommentRepository, private taskRepo: TaskRepository)
   - findByTaskId(taskId: string): Comment[]  ← valida que task existe
   - create(taskId: string, authorId: string, data: CreateCommentDTO): Comment
   - delete(id: string, requesterId: string): void  ← lança ForbiddenError se não é o autor

5. src/services/AuthService.ts:
   - constructor(private userRepo: UserRepository)
   - register(data: CreateUserDTO): LoginResponse  ← cria user + retorna token
   - login(data: LoginDTO): LoginResponse  ← valida credenciais, retorna JWT
   - verifyToken(token: string): AuthPayload

Use as classes de erro de src/utils/errors.ts. Documente cada método com JSDoc incluindo @throws.
```

**Arquivos esperados:** `src/services/UserService.ts`, `ProjectService.ts`, `TaskService.ts`, `CommentService.ts`, `AuthService.ts`

---

### Passo 1.4 — Camada de Controllers

**Objetivo:** Criar os controllers HTTP que delegam para os services e retornam respostas padronizadas.

```
Crie a camada de controllers do TaskFlow API. Controllers são responsáveis apenas por: extrair dados do req, chamar o service, usar os helpers de response. Nenhuma lógica de negócio aqui:

1. src/controllers/AuthController.ts:
   - register(req, res, next): chama authService.register, retorna created()
   - login(req, res, next): chama authService.login, retorna success()

2. src/controllers/UserController.ts:
   - index(req, res, next): lista todos os usuários
   - show(req, res, next): busca por ID
   - update(req, res, next): atualização completa (PUT)
   - partialUpdate(req, res, next): atualização parcial (PATCH)
   - destroy(req, res, next): deleta usuário

3. src/controllers/ProjectController.ts:
   - index(req, res, next): lista projetos com filtros opcionais da query string
   - show(req, res, next): busca projeto por ID
   - create(req, res, next): cria projeto
   - update(req, res, next): atualização completa (PUT)
   - partialUpdate(req, res, next): atualização parcial (PATCH)
   - destroy(req, res, next): deleta projeto

4. src/controllers/TaskController.ts:
   - index(req, res, next): lista tasks com filtros (projectId, status, priority)
   - show(req, res, next): busca task por ID
   - create(req, res, next): cria task
   - update(req, res, next): atualização completa (PUT)
   - updateStatus(req, res, next): atualiza apenas o status (PATCH /tasks/:id/status)
   - destroy(req, res, next): deleta task
   - listComments(req, res, next): lista comentários da task
   - addComment(req, res, next): adiciona comentário
   - removeComment(req, res, next): remove comentário

Cada controller deve:
- Ser uma classe com métodos bound ao this (use arrow functions nos métodos)
- Receber os services via construtor
- Sempre passar erros para o next(error) em vez de deixar explodir
- Usar os helpers de src/utils/response.ts para todas as respostas
```

**Arquivos esperados:** `src/controllers/AuthController.ts`, `UserController.ts`, `ProjectController.ts`, `TaskController.ts`

---

### Passo 1.5 — Rotas, Middlewares e Swagger

**Objetivo:** Registrar todas as rotas com validações Zod e documentar a API com Swagger.

```
Crie as rotas, middlewares e documentação Swagger do TaskFlow API:

1. src/middlewares/auth.ts:
   - Middleware authenticate: verifica Authorization header Bearer, chama authService.verifyToken, adiciona req.user = payload
   - Middleware requireRole(...roles): verifica se req.user.role está nos roles permitidos

2. src/middlewares/errorHandler.ts:
   - Captura todos os erros passados para next(error)
   - Se for AppError, responde com o statusCode e message
   - Se for ZodError, transforma em ValidationError (400)
   - Se for erro desconhecido, responde 500 com mensagem genérica (sem expor detalhes em produção)
   - Loga o erro no console com stack trace em desenvolvimento

3. src/middlewares/notFound.ts: responde 404 para rotas não mapeadas

4. src/middlewares/requestLogger.ts: loga method, url, status e tempo de resposta

5. Schemas Zod de validação em src/utils/schemas.ts:
   - createUserSchema, updateUserSchema, loginSchema
   - createProjectSchema, updateProjectSchema, patchProjectSchema
   - createTaskSchema, updateTaskSchema, updateTaskStatusSchema (enum das transições válidas)
   - createCommentSchema

6. src/routes/authRoutes.ts: POST /auth/register e POST /auth/login com validação Zod
7. src/routes/userRoutes.ts: GET, PUT, PATCH, DELETE em /users e /users/:id (requer authenticate)
8. src/routes/projectRoutes.ts: CRUD completo em /projects e /projects/:id
9. src/routes/taskRoutes.ts: CRUD em /tasks, PATCH /tasks/:id/status, e rotas de comments
10. src/routes/index.ts: registra todos os routers no Express app

11. src/config/swagger.ts: configuração do swagger-jsdoc com info do projeto e servidores
    - Adicione comentários JSDoc @swagger nas rotas principais (pelo menos 2 por entidade)
    - Configure rota GET /api-docs para o swagger-ui

12. Atualize src/app.ts para registrar todas as rotas e middlewares na ordem correta:
    requestLogger → rotas → notFound → errorHandler

Após criar tudo, rode `npm run dev` e verifique que:
- GET /health retorna { status: "ok" }
- GET /api-docs abre o Swagger UI
- POST /auth/register com body inválido retorna 400 com mensagem de erro
```

**Arquivos esperados:** middlewares, schemas Zod, 4 arquivos de rotas, swagger config, app.ts atualizado

---

## FASE 2 — Infraestrutura de Testes

### Passo 2.1 — Helpers de teste: app-factory, data-factory e auth-helper

**Objetivo:** Criar os helpers reutilizáveis que todas as suítes de integração vão usar.

```
Crie a infraestrutura de suporte para os testes de integração do TaskFlow API:

1. tests/integration/helpers/app-factory.ts:
   - Função createTestApp(): instancia repositórios frescos + cria o Express app
   - Retorna { app, repositories } onde repositories é o objeto com todas as instâncias
   - Cada chamada retorna um app completamente isolado (sem estado compartilhado entre testes)
   - Isso garante que cada describe/it pode ter seu próprio estado limpo

2. tests/integration/helpers/data-factory.ts usando @faker-js/faker:
   - makeUser(overrides?: Partial<CreateUserDTO>): CreateUserDTO — gera dados de usuário
   - makeProject(overrides?: Partial<CreateProjectDTO>): CreateProjectDTO
   - makeTask(overrides?: Partial<CreateTaskDTO>): CreateTaskDTO
   - makeComment(overrides?: Partial<CreateCommentDTO>): CreateCommentDTO
   - makeUserSeed(repo: UserRepository): Promise<User> — cria e persiste um usuário
   - makeProjectSeed(repo: ProjectRepository, ownerId: string): Promise<Project>
   - makeTaskSeed(repo: TaskRepository, projectId: string): Promise<Task>
   Gere dados realistas: nomes reais, emails válidos, descrições em português

3. tests/integration/helpers/auth-helper.ts:
   - Função getAuthToken(app: Express, user?: Partial<CreateUserDTO>): Promise<string>
     Registra um usuário de teste e retorna o JWT para usar nos headers
   - Função getAdminToken(app: Express): Promise<string>
     Versão com role ADMIN

4. tests/integration/helpers/setup.ts (setupFile do Vitest):
   - Configura beforeAll/afterAll globais se necessário
   - Pode configurar variáveis de ambiente para os testes

5. Crie tests/integration/helpers/index.ts re-exportando todos os helpers

Todos os helpers devem ter tipos TypeScript corretos e JSDoc em português explicando o propósito.
```

**Arquivos esperados:** os 5 arquivos em `tests/integration/helpers/`

---

### Passo 2.2 — Configuração do MSW v2

**Objetivo:** Configurar o MSW para interceptar requests a serviços externos nos testes.

```
Configure o Mock Service Worker (MSW v2) para simular serviços externos nos testes de integração do TaskFlow API:

1. tests/integration/msw/handlers.ts:
   Crie handlers para serviços externos fictícios que a TaskFlow API usaria:
   - Handler para um serviço de notificação de email: POST https://notifications.taskflow.io/send
     Retorna { messageId: uuid, status: 'queued' }
   - Handler para um serviço de busca de CEP: GET https://viacep.com.br/ws/:cep/json/
     Retorna dados de endereço mockados
   - Handler global de fallback: qualquer request não mapeado loga um aviso e retorna 500
     (evita requests reais saindo nos testes inadvertidamente)

2. tests/integration/msw/server.ts:
   - Cria o setupServer do MSW com os handlers
   - Exporta o server
   - Exporta funções helper: mockEmailSuccess(), mockEmailFailure()
     para que os testes possam mudar o comportamento do mock em casos específicos

3. Atualize tests/integration/helpers/setup.ts:
   - beforeAll: server.listen({ onUnhandledRequest: 'warn' })
   - afterEach: server.resetHandlers()
   - afterAll: server.close()

4. Crie um exemplo de uso no arquivo tests/integration/msw/example.test.ts:
   - Um teste simples que demonstra como usar o MSW handler
   - Mostra como sobrescrever um handler para um teste específico (server.use())
   - Adicione comentários explicando o padrão para o time

Documente os handlers explicando qual serviço externo cada um simula e por quê.
```

**Arquivos esperados:** `tests/integration/msw/handlers.ts`, `server.ts`, `example.test.ts` e `setup.ts` atualizado

---

## FASE 3 — Escrita dos Testes

### Passo 3.1 — Testes unitários dos Services

**Objetivo:** Testar a lógica de negócio dos services de forma isolada, com repositórios mockados.

```
Crie os testes unitários dos services do TaskFlow API em tests/unit/services/:

Para cada teste unitário, use vi.fn() para mockar os repositórios (não use a implementação in-memory aqui — esse é o ponto dos unitários: testar a lógica sem dependências reais).

1. tests/unit/services/projectService.test.ts:
   Cubra os cenários:
   - findById: retorna o projeto quando encontrado
   - findById: lança NotFoundError quando não existe
   - create: cria projeto com sucesso quando ownerId é válido
   - create: lança NotFoundError quando ownerId não existe
   - delete: lança ConflictError quando projeto tem tasks ativas (mocke TaskRepository)
   - update: atualiza os campos corretamente

2. tests/unit/services/taskService.test.ts:
   Cubra os cenários:
   - create: cria task com sucesso em projeto ACTIVE
   - create: lança ConflictError quando projeto está ARCHIVED
   - create: lança NotFoundError quando projectId não existe
   - updateStatus: transição válida TODO → IN_PROGRESS
   - updateStatus: transição válida IN_PROGRESS → DONE
   - updateStatus: lança ValidationError para transição inválida (ex: TODO → DONE direto)
   - updateStatus: lança ValidationError para transição inválida (ex: DONE → IN_PROGRESS)
   - delete: lança ConflictError quando status é IN_PROGRESS

3. tests/unit/services/userService.test.ts:
   Cubra os cenários:
   - create: cria usuário com sucesso
   - create: lança ConflictError quando email já existe
   - findAll: nunca retorna passwordHash nos resultados
   - delete: lança ForbiddenError quando user tem tasks IN_PROGRESS

Use describe aninhados para organizar por método. Use it.each() onde fizer sentido (ex: testar múltiplas transições inválidas de uma vez).
Cada teste deve ter nome descritivo em português: "deve lançar NotFoundError quando o projeto não existe"
```

**Arquivos esperados:** os 3 arquivos de testes unitários

---

### Passo 3.2 — Testes de integração: Projects

**Objetivo:** Testar as rotas de Projects via HTTP com Supertest, cobrindo todos os métodos.

```
Crie os testes de integração para as rotas de Projects em tests/integration/projects.test.ts:

Use os helpers de tests/integration/helpers/ (createTestApp, data-factory, auth-helper).
Cada describe deve criar seu próprio app isolado via createTestApp() para evitar estado compartilhado.

Cubra obrigatoriamente os seguintes cenários:

GET /projects:
- retorna lista vazia quando não há projetos
- retorna todos os projetos criados
- filtra por status quando ?status=ACTIVE é passado
- retorna 401 quando não autenticado

GET /projects/:id:
- retorna o projeto correto por ID
- retorna 404 quando ID não existe
- retorna 400 quando ID é inválido

POST /projects:
- cria projeto com dados válidos e retorna 201
- retorna 400 quando campos obrigatórios estão ausentes
- retorna 400 com detalhes dos erros de validação Zod
- retorna 401 sem autenticação

PUT /projects/:id:
- substitui todos os campos do projeto
- retorna 404 quando projeto não existe

PATCH /projects/:id:
- atualiza apenas os campos enviados
- campos não enviados permanecem inalterados
- retorna 400 quando status é inválido

DELETE /projects/:id:
- deleta o projeto com sucesso e retorna 204
- retorna 404 quando projeto não existe
- retorna 409 quando projeto tem tasks ativas

Para cada request autenticado, use getAuthToken() do auth-helper.
Use expect.objectContaining() para validar a estrutura das respostas sem acoplamento desnecessário.
Nomeie cada teste como: "GET /projects - deve retornar 401 quando não autenticado"
```

**Arquivo esperado:** `tests/integration/projects.test.ts`

---

### Passo 3.3 — Testes de integração: Tasks e Comments

**Objetivo:** Testar as rotas de Tasks com foco na rota PATCH de transição de status e as rotas de Comments.

```
Crie os testes de integração para as rotas de Tasks e Comments em tests/integration/tasks.test.ts:

Além dos cenários CRUD básicos (similares a projects.test.ts), cubra obrigatoriamente:

PATCH /tasks/:id/status (rota de negócio — prioridade alta):
- transição válida TODO → IN_PROGRESS retorna 200 com novo status
- transição válida IN_PROGRESS → DONE retorna 200
- transição inválida TODO → DONE direto retorna 400 com mensagem clara
- transição inválida DONE → IN_PROGRESS retorna 400
- transição para CANCELLED funciona a partir de TODO e IN_PROGRESS
- retorna 404 quando task não existe

GET /tasks com filtros:
- ?projectId=X retorna apenas tasks do projeto X
- ?status=IN_PROGRESS retorna apenas tasks com aquele status
- ?priority=HIGH retorna apenas tasks de alta prioridade
- combinação de filtros funciona corretamente

POST /tasks/:id/comments:
- cria comentário com sucesso em task existente
- retorna 404 quando task não existe
- retorna 401 sem autenticação

DELETE /tasks/:id/comments/:commentId:
- deleta comentário próprio com sucesso
- retorna 403 quando tenta deletar comentário de outro usuário
- retorna 404 quando comentário não existe

Crie um cenário de fluxo completo (happy path):
- Cria um projeto
- Cria uma task nesse projeto
- Muda status para IN_PROGRESS
- Adiciona um comentário
- Muda status para DONE
- Tenta mudar status de volta para IN_PROGRESS (deve falhar com 400)
Esse cenário documenta o comportamento esperado do negócio de forma narrativa.
```

**Arquivo esperado:** `tests/integration/tasks.test.ts`

---

### Passo 3.4 — Testes de integração: Auth e Users

**Objetivo:** Cobrir autenticação, autorização por role e as rotas de Users.

```
Crie os testes de integração para Auth e Users em tests/integration/auth.test.ts e tests/integration/users.test.ts:

auth.test.ts:
POST /auth/register:
- registra usuário com dados válidos e retorna 201 com token e dados do usuário
- retorna 400 com email inválido
- retorna 400 sem campos obrigatórios
- retorna 409 quando email já está cadastrado
- a resposta NUNCA deve conter passwordHash (campo sensível)

POST /auth/login:
- autentica com credenciais corretas e retorna token JWT válido
- retorna 401 com senha incorreta
- retorna 401 com email não cadastrado
- retorna 400 com body inválido
- o token retornado deve ser usável em rotas autenticadas (teste encadeado)

users.test.ts:
GET /users:
- retorna lista de usuários sem passwordHash em nenhum objeto
- ADMIN pode listar todos os usuários
- MEMBER pode listar usuários

PATCH /users/:id:
- usuário pode atualizar seus próprios dados
- retorna 403 quando MEMBER tenta atualizar outro usuário
- ADMIN pode atualizar qualquer usuário

DELETE /users/:id:
- retorna 403 quando MEMBER tenta deletar outro usuário
- retorna 403 quando user tem tasks IN_PROGRESS
- ADMIN pode deletar qualquer usuário sem tasks ativas

Teste de segurança crítico — inclua em ambos os arquivos:
- Verifique que tokens expirados ou inválidos retornam 401
- Verifique que manipular manualmente o payload do JWT não funciona
```

**Arquivos esperados:** `tests/integration/auth.test.ts`, `tests/integration/users.test.ts`

---

### Passo 3.5 — Pipeline CI/CD com GitHub Actions

**Objetivo:** Configurar o pipeline que roda os testes automaticamente em push e pull request.

```
Crie o pipeline de CI/CD em .github/workflows/ci.yml para o TaskFlow API:

O pipeline deve:

1. Disparar em: push para main e develop, e pull_request para main

2. Job "test" com Node.js 20:
   - Checkout do código
   - Setup Node.js com cache do npm
   - npm ci (instalação determinística)
   - npm run test (unitários)
   - npm run test:integration (integração)
   - Upload do relatório de cobertura como artifact

3. Job "build" (depende do test):
   - npm run build
   - Verifica que o build TypeScript passou sem erros

4. Variáveis de ambiente no CI:
   - NODE_ENV: test
   - JWT_SECRET: test-secret-for-ci
   - ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }} (opcional, só para Fase 4)

5. Crie também docs/architecture/decisions.md com as seguintes ADRs (Architecture Decision Records):
   - ADR-001: Por que in-memory em vez de Docker nos testes
   - ADR-002: Por que Vitest em vez de Jest
   - ADR-003: Por que Express em vez de Fastify para esta POC
   - ADR-004: Estratégia de teste local vs deploy (BASE_URL pattern)
   
   Cada ADR deve ter: Contexto, Decisão, Consequências (positivas e negativas)

Adicione no README.md do projeto um badge do GitHub Actions e uma seção "Como rodar os testes" explicando os comandos npm run test e npm run test:integration.
```

**Arquivos esperados:** `.github/workflows/ci.yml`, `docs/architecture/decisions.md`, `README.md` atualizado

---

## FASE 4 — Demo: IA nos Testes

### Passo 4.1 — Script de geração de testes com Claude API

**Objetivo:** Criar o script que chama o Claude API e gera um arquivo de testes completo para uma rota.

```
Crie o script scripts/generate-tests.ts que usa o Claude API para gerar testes de integração automaticamente:

O script deve:
1. Receber como argumento o caminho de um arquivo de rotas: npx tsx scripts/generate-tests.ts src/routes/projectRoutes.ts

2. Ler o arquivo de rota especificado

3. Montar um prompt para o Claude que inclua:
   - O conteúdo do arquivo de rotas
   - O conteúdo dos modelos TypeScript relacionados (src/models/)
   - Um exemplo de teste já existente (tests/integration/projects.test.ts) como referência de estilo
   - Instruções específicas: "Gere um arquivo de testes de integração completo seguindo exatamente o mesmo padrão do exemplo. Use createTestApp(), data-factory e auth-helper. Cubra: todos os status codes esperados, casos de erro, validação de campos obrigatórios e pelo menos um happy path completo."

4. Chamar @anthropic-ai/sdk com modelo claude-sonnet-4-6

5. Salvar o resultado em tests/ai-generated/{nome-do-arquivo}.test.ts

6. Exibir no terminal:
   - Arquivo gerado com sucesso: tests/ai-generated/...
   - Número de cenários detectados na resposta
   - Comando para rodar: npx vitest run tests/ai-generated/...

Trate erros: ANTHROPIC_API_KEY não configurada, arquivo de rota não encontrado, falha na API.

Adicione no início do arquivo gerado um comentário:
// ⚠️ Arquivo gerado automaticamente pelo Claude AI em {data}
// Rota de origem: {arquivo}
// Revise e ajuste antes de commitar.

Crie também um arquivo docs/ebook/04-ia-nos-testes.md descrevendo o que este script faz e como ele se encaixa no fluxo de desenvolvimento.
```

**Arquivos esperados:** `scripts/generate-tests.ts`, `docs/ebook/04-ia-nos-testes.md`

---

### Passo 4.2 — Executar a geração e validar os testes gerados

**Objetivo:** Demonstrar o script em funcionamento e registrar o resultado para o ebook.

```
Execute e valide o script de geração de testes com IA:

1. Configure a ANTHROPIC_API_KEY no arquivo .env

2. Execute o script para gerar testes da rota de tasks:
   npx tsx scripts/generate-tests.ts src/routes/taskRoutes.ts

3. Analise o arquivo gerado em tests/ai-generated/:
   - Os testes importam os helpers corretos?
   - Os cenários cobrem os métodos HTTP da rota?
   - Há casos de erro (400, 401, 404, 409)?
   - Há pelo menos um happy path?

4. Execute os testes gerados:
   npx vitest run tests/ai-generated/

5. Para qualquer teste que falhar:
   - Identifique se é problema no teste gerado ou na implementação da API
   - Corrija o teste gerado (isso é esperado — IA não é perfeita)
   - Documente o que precisou ser ajustado

6. Atualize docs/ebook/04-ia-nos-testes.md com:
   - Print/exemplo do output do script
   - Quais cenários a IA acertou de primeira
   - O que precisou ser ajustado manualmente
   - Avaliação: qual % dos testes gerados rodou sem ajuste?

7. Documente os resultados no AI-LOGS-EXECUTION.md no passo 4.2

Esta etapa é a demonstração central da POC: um engenheiro descreve uma rota, a IA gera os testes, o engenheiro revisa e ajusta. Capture isso.
```

**Arquivos esperados:** arquivo em `tests/ai-generated/`, `docs/ebook/04-ia-nos-testes.md` atualizado, log atualizado

---

### Passo 4.3 — Analisador de cobertura com IA

**Objetivo:** Criar um segundo script que usa Claude para analisar a cobertura e sugerir testes faltantes.

```
Crie o script scripts/analyze-coverage.ts que usa Claude para sugerir testes faltantes:

1. O script deve:
   - Rodar `npm run test:coverage` e capturar o relatório JSON de cobertura
   - Ler os arquivos de teste existentes em tests/
   - Montar um prompt para o Claude com: relatório de cobertura + arquivos de serviço não cobertos
   - Pedir para Claude: "Analise a cobertura e liste os 5 cenários de teste mais críticos que estão faltando, com justificativa de risco para cada um"
   - Salvar a análise em docs/coverage-analysis.md

2. Adicione o script ao package.json:
   "analyze:coverage": "npm run test:coverage && tsx scripts/analyze-coverage.ts"

3. Execute o script e salve o resultado

4. Crie docs/ebook/04-ia-nos-testes.md com uma seção adicional:
   "IA como revisora de cobertura" — explique o que o script faz e mostre um exemplo do output

Este script demonstra um segundo caso de uso da IA: não apenas gerando testes, mas identificando gaps de cobertura que um engenheiro poderia não perceber.
```

**Arquivos esperados:** `scripts/analyze-coverage.ts`, `docs/coverage-analysis.md`, `docs/ebook/04-ia-nos-testes.md` expandido

---

## FASE 5 — Documentação e Ebook

### Passo 5.1 — Capítulos do Ebook

**Objetivo:** Criar os arquivos markdown de cada capítulo do ebook com base no que foi construído.

```
Crie o conteúdo dos capítulos do ebook em docs/ebook/. Use o AI-LOGS-EXECUTION.md como base para o conteúdo — ele contém o registro de tudo que foi feito:

1. docs/ebook/00-introducao.md:
   - O problema que esta POC resolve
   - O que você vai aprender lendo este documento
   - Stack técnica escolhida e justificativas
   - Como navegar pelo documento

2. docs/ebook/01-arquitetura.md:
   - Diagrama ASCII da arquitetura (Controller → Service → Repository)
   - Por que cada camada existe
   - Como a separação facilita os testes
   - As ADRs mais importantes (resumo de docs/architecture/decisions.md)

3. docs/ebook/02-api-e-rotas.md:
   - Tabela completa de rotas com método, path, autenticação necessária, status codes
   - Exemplos de request/response para cada entidade (copie dos testes de integração)
   - As regras de negócio implementadas (transições de status, validações)
   - Como acessar o Swagger UI

4. docs/ebook/03-estrategia-de-testes.md:
   - A pirâmide de testes adotada
   - Por que in-memory em vez de Docker
   - O padrão createTestApp() e por que ele importa
   - Como os mesmos testes rodam local e no CI/CD (GitHub Actions)
   - Guia prático: como escrever um novo teste de integração

5. docs/ebook/05-conclusao-e-proximos-passos.md:
   - O que foi demonstrado
   - Métricas finais (cobertura, número de testes, rotas)
   - Próximos passos para produção: Testcontainers Cloud, Pact/PactFlow, k6
   - Como escalar essa estratégia para múltiplos serviços

Escreva em português, tom técnico mas acessível. Cada capítulo deve ter entre 400-800 palavras.
```

**Arquivos esperados:** os 5 capítulos em `docs/ebook/`

---

### Passo 5.2 — Script de geração do PDF (Ebook final)

**Objetivo:** Criar o script que compila todos os arquivos .md em um único PDF formatado.

```
Crie o script scripts/generate-ebook.ts que gera o ebook em PDF:

1. O script deve:
   - Definir a ordem dos capítulos: 00, 01, 02, 03, 04, 05
   - Ler cada arquivo .md de docs/ebook/ nessa ordem
   - Concatenar com separadores de página entre capítulos
   - Adicionar uma página de capa com: título, subtítulo, data de geração, versão
   - Adicionar sumário automático com os títulos H1 e H2 de cada capítulo
   - Usar o pacote md-to-pdf para gerar o PDF em docs/taskflow-api-poc.pdf

2. Configure o md-to-pdf com:
   - Tamanho de página: A4
   - Margens: 2cm
   - Fonte: sans-serif 11pt
   - Estilo para blocos de código: fundo cinza claro, fonte mono
   - Cabeçalho em cada página: "TaskFlow API — POC de Testes com IA"
   - Rodapé em cada página: número de página

3. Após gerar, exiba:
   - Caminho do arquivo gerado
   - Número de páginas
   - Tamanho do arquivo

4. Execute o script: npx tsx scripts/generate-ebook.ts

5. Verifique o PDF gerado e ajuste o CSS/estilos se necessário

Adicione ao package.json: "ebook": "tsx scripts/generate-ebook.ts"
```

**Arquivo esperado:** `scripts/generate-ebook.ts`, `docs/taskflow-api-poc.pdf` gerado

---

### Passo 5.3 — Revisão final e relatório de conclusão

**Objetivo:** Rodar todos os testes, verificar cobertura e gerar o relatório final da POC.

```
Execute a revisão final do projeto TaskFlow API e gere o relatório de conclusão:

1. Rode todos os testes e capture os resultados:
   npm run test:all

2. Rode o relatório de cobertura:
   npm run test:coverage

3. Com base nos resultados, atualize a seção "Resumo Final" em AI-LOGS-EXECUTION.md:
   - Total de testes escritos (unitários + integração + ai-generated)
   - Cobertura de código final (%)
   - Rotas cobertas (quantas das 23+ rotas têm pelo menos 1 teste)
   - Tempo total de execução dos testes
   - Status do build TypeScript (npm run build)

4. Atualize docs/ebook/05-conclusao-e-proximos-passos.md com as métricas reais

5. Gere o ebook final: npm run ebook

6. Verifique que o arquivo docs/taskflow-api-poc.pdf foi gerado corretamente

7. Crie um CHANGELOG.md na raiz com todas as features implementadas organizadas por fase

8. Faça o commit final com a mensagem:
   "feat: POC completa - testes de integração com IA, cobertura X%, Y testes"

Ao final, liste no terminal:
- ✅ ou ❌ para cada item da lista de "Resultado Esperado" do instructions/README.md
```

**Arquivos esperados:** `CHANGELOG.md`, `docs/taskflow-api-poc.pdf` final, `AI-LOGS-EXECUTION.md` completado

---

*Dúvidas sobre algum passo? Descreva o problema para o Claude Code e ele vai ajustar a abordagem.*
