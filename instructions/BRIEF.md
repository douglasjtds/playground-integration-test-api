# TaskFlow API — POC de Testes de Integração com IA

> Proof of Concept: como estruturar, executar e evoluir testes de integração em APIs Node.js utilizando inteligência artificial como parte ativa do fluxo de qualidade.

---

## Contexto e Motivação

Esta POC foi criada para responder uma pergunta estratégica do time:

> **"Como vamos testar nossas APIs no futuro — tanto local quanto em deploy — à medida que o projeto cresce?"**

Em projetos de longa duração com APIs escaláveis, o maior custo de manutenção não é escrever o código — é manter a suíte de testes confiável enquanto a API evolui. Rotas mudam, regras de negócio crescem, integrações externas aparecem. Sem uma estratégia clara, os testes ficam para trás ou viram obstáculo.

Esta POC demonstra que **a IA pode ser parte da solução**: gerando testes a partir de definições de rota, sugerindo casos de borda, atualizando testes quando a API muda e documentando o que foi feito ao longo do projeto.

---

## O Que Esta POC Responde

| Pergunta | O que a POC demonstra |
|---|---|
| Como estruturar os testes de integração? | Pirâmide em camadas: unitários → integração → E2E/performance |
| Como testar sem Docker na máquina? | Repositórios in-memory + pg-mem como alternativas viáveis |
| Como os mesmos testes rodam local e em deploy? | Estratégia com `BASE_URL` + Supertest + GitHub Actions |
| Como a IA entra no fluxo de testes? | Claude Code CLI gerando testes de integração a partir de prompts conversacionais |
| Como documentar tudo ao final? | Logs estruturados de execução → ebook em PDF |

---

## Domínio da API: TaskFlow

A API construída nesta POC é o **TaskFlow** — um sistema de gerenciamento de projetos e tarefas para times de desenvolvimento. O domínio foi escolhido por ter entidades com relacionamentos claros, transições de estado e operações que justificam todos os métodos HTTP.

### Entidades

- **Users** — membros do time (cadastro, autenticação, perfil)
- **Projects** — projetos com nome, descrição e status (`ACTIVE`, `ARCHIVED`, `COMPLETED`)
- **Tasks** — tarefas vinculadas a projetos, com prioridade e status (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`)
- **Comments** — comentários em tarefas (com ownership e auditoria)

### Mapa de Rotas

```
POST   /auth/register
POST   /auth/login

GET    /users
GET    /users/:id
PUT    /users/:id          ← substituição completa
PATCH  /users/:id          ← atualização parcial
DELETE /users/:id

GET    /projects
GET    /projects/:id
POST   /projects
PUT    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

GET    /tasks              ← suporta filtros: ?projectId= &status= &priority=
GET    /tasks/:id
POST   /tasks
PUT    /tasks/:id
PATCH  /tasks/:id/status   ← transição de estado (negócio)
DELETE /tasks/:id

GET    /tasks/:id/comments
POST   /tasks/:id/comments
DELETE /tasks/:id/comments/:commentId
```

---

## Stack Técnica

| Camada | Ferramenta | Por quê |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript 5 | Padrão de mercado 2026 |
| Framework HTTP | Express 4.x | Estável, amplamente documentado, base comum no time |
| Validação | Zod | Integração nativa com TypeScript, schemas reutilizáveis |
| Test runner | Vitest | Substituto moderno do Jest — ESM-native, mais rápido |
| Testes HTTP | Supertest | Padrão de mercado para integração em Node.js |
| Mocking externo | MSW v2 | Intercepta requests de serviços externos sem adapters |
| Dados de teste | @faker-js/faker | Geração de fixtures realistas e repetíveis |
| IA para testes | Claude Code CLI | Claude gerando testes via prompts conversacionais no terminal |
| Docs API | swagger-ui-express + swagger-jsdoc | OpenAPI 3.0 documentado inline no código |
| DB em testes | In-memory (Map) | Sem dependência de Docker ou serviço externo |
| PDF | md-to-pdf | Geração do ebook a partir dos arquivos .md |

> ⚠️ **Nenhuma instalação de sistema operacional necessária.** Tudo roda via `npm install`.
> Sem Docker, sem serviços externos obrigatórios para rodar os testes.

---

## Arquitetura da Aplicação

```
Request HTTP
      │
      ▼
┌──────────────────┐
│   Middleware      │  autenticação JWT, validação Zod, logger, CORS
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Controller      │  recebe req/res, extrai dados, chama service, retorna resposta
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Service        │  regras de negócio, validações de domínio, orquestra repositórios
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Repository      │  acesso a dados — in-memory nos testes, PostgreSQL em produção
└──────────────────┘
```

**Princípios seguidos:**
- Controllers não contêm lógica de negócio — apenas HTTP in/out
- Services não conhecem Express (sem `req`/`res` nos parâmetros)
- Repositories são substituíveis via interface — mesmo contrato, implementações diferentes
- Injeção de dependência via construtor em todas as camadas

---

## Estrutura de Pastas

```
├── src/
│   ├── app.ts                       # Express factory function (sem server.listen)
│   ├── server.ts                    # Entry point — inicia o servidor
│   ├── models/                      # Interfaces TypeScript, enums, DTOs
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Task.ts
│   │   └── Comment.ts
│   ├── repositories/
│   │   ├── interfaces/              # Contratos genéricos (IRepository<T>)
│   │   ├── UserRepository.ts
│   │   ├── ProjectRepository.ts
│   │   ├── TaskRepository.ts
│   │   └── CommentRepository.ts
│   ├── services/
│   │   ├── UserService.ts
│   │   ├── ProjectService.ts
│   │   ├── TaskService.ts
│   │   └── CommentService.ts
│   ├── controllers/
│   │   ├── UserController.ts
│   │   ├── ProjectController.ts
│   │   ├── TaskController.ts
│   │   └── CommentController.ts
│   ├── routes/
│   │   ├── index.ts                 # Agrega todos os routers
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── projectRoutes.ts
│   │   └── taskRoutes.ts
│   ├── middlewares/
│   │   ├── auth.ts                  # Verifica JWT
│   │   ├── errorHandler.ts          # Tratamento global de erros
│   │   ├── notFound.ts              # Rota não encontrada
│   │   └── requestLogger.ts         # Log de requisições
│   ├── utils/
│   │   ├── errors.ts                # Classes de erro customizadas
│   │   ├── response.ts              # Helpers para respostas padronizadas
│   │   └── validator.ts             # Wrapper Zod + Express
│   └── config/
│       └── swagger.ts               # Configuração do Swagger
│
├── tests/
│   ├── unit/
│   │   └── services/                # Testes isolados por service
│   │       ├── projectService.test.ts
│   │       ├── taskService.test.ts
│   │       └── userService.test.ts
│   ├── integration/
│   │   ├── helpers/
│   │   │   ├── app-factory.ts       # Cria instância do app para testes
│   │   │   ├── data-factory.ts      # Gera dados de teste com faker
│   │   │   └── auth-helper.ts       # Helpers de autenticação nos testes
│   │   ├── msw/
│   │   │   ├── server.ts            # Setup do MSW para Node
│   │   │   └── handlers.ts          # Handlers para serviços externos mockados
│   │   ├── projects.test.ts
│   │   ├── tasks.test.ts
│   │   ├── users.test.ts
│   │   └── auth.test.ts
│
├── scripts/
│   └── generate-ebook.ts            # Compila docs/ebook/ em PDF
│
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   └── decisions.md             # ADRs (Architecture Decision Records)
│   └── ebook/
│       ├── 00-introducao.md
│       ├── 01-arquitetura.md
│       ├── 02-api-e-rotas.md
│       ├── 03-estrategia-de-testes.md
│       ├── 04-ia-nos-testes.md
│       └── 05-conclusao-e-proximos-passos.md
│
├── instructions/                    # ← VOCÊ ESTÁ AQUI
│   ├── BRIEF.md                    # Este arquivo
│   ├── TODOS.md                     # Prompts de execução passo a passo
│   └── AI-LOGS-EXECUTION.md         # Log de execução para geração da documentação
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # Pipeline de testes no GitHub Actions
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts                 # Config para testes unitários
├── vitest.integration.config.ts     # Config para testes de integração
└── README.md                        # README público do projeto
```

---

## Como Usar Este Guia

### Fluxo de trabalho recomendado

```
1. Abra a pasta do projeto no VS Code
2. Abra o Claude Code (Claude CLI) no terminal integrado
3. Abra o arquivo TODOS.md em paralelo
4. Execute os passos em ordem — um passo por sessão do Claude Code
5. Após cada passo, atualize AI-LOGS-EXECUTION.md com o que foi feito
6. Ao final (Fase 4), rode o prompt de geração do ebook em PDF
```

### Sobre os prompts em TODOS.md

- Cada prompt é **autossuficiente** — contém todo o contexto necessário para execução
- Claude Code tem acesso à estrutura de arquivos do projeto já criado
- Se um passo falhar parcialmente, registre em `AI-LOGS-EXECUTION.md` e continue
- Os prompts podem ser ajustados se o time tiver preferências diferentes (ex: Fastify em vez de Express)

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=taskflow-secret-key-poc
```

---

## Pré-requisitos

- [ ] Node.js 20 ou superior (`node --version`)
- [ ] npm 10 ou superior (`npm --version`)
- [ ] VS Code com extensão Claude Code instalada
- [ ] Claude Code CLI instalado (para geração de testes assistida por IA)
- [ ] Git configurado localmente

---

## Resultado Esperado ao Final

- ✅ API REST completa com 23+ rotas cobrindo todos os métodos HTTP
- ✅ Arquitetura em 3 camadas (Controller → Service → Repository)
- ✅ Testes unitários dos services com mocks
- ✅ Testes de integração via Supertest sem Docker
- ✅ Mocking de serviços externos com MSW v2
- ✅ Pipeline CI/CD configurado no GitHub Actions
- ✅ Testes gerados com auxílio do Claude Code CLI a partir de prompts conversacionais
- ✅ Ebook em PDF documentando toda a jornada técnica da POC

---

## Navegação Rápida

| Arquivo | Finalidade |
|---|---|
| `TODOS.md` | 19 prompts prontos, organizados em 4 fases de execução |
| `AI-LOGS-EXECUTION.md` | Template de log por passo + seção de resumo final para o PDF |

---

*Domínio fictício (TaskFlow) escolhido para maximizar variedade de rotas, regras de negócio e casos de teste. Substitua por qualquer domínio do projeto real sem alterar a estratégia de testes.*
