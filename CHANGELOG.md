# Changelog

Todas as mudanças relevantes do projeto TaskFlow API estao documentadas neste arquivo.

---

## [1.0.0] - 2026-06-22

### Fase 0 — Fundacao do Projeto

- Scaffold inicial com package.json, .env.example, .gitignore e estrutura de pastas
- Configuracao TypeScript strict mode com path aliases (@/*)
- Configuracao Vitest para testes unitarios e de integracao (configs separadas)
- App base Express com factory function createApp() e utilitarios (errors, response, validator)

### Fase 1 — Construcao da API

- Modelos TypeScript: User, Project, Task, Comment, Auth (interfaces, enums, DTOs)
- Repositorios in-memory com Map<string, T> e interface generica IRepository<T>
- Services com regras de negocio: UserService, ProjectService, TaskService, CommentService, AuthService
- Controllers HTTP: AuthController, UserController, ProjectController, TaskController
- 23 rotas REST com validacao Zod, autenticacao JWT e documentacao Swagger
- Middlewares: auth, errorHandler, notFound, requestLogger
- Maquina de estados de tasks (TODO -> IN_PROGRESS -> DONE, com CANCELLED)

### Fase 2 — Infraestrutura de Testes

- Helpers de teste: app-factory (isolamento por teste), data-factory (@faker-js/faker pt_BR), auth-helper
- Configuracao MSW v2 para mock de servicos externos (email, ViaCEP, fallback)

### Fase 3 — Escrita dos Testes e CI/CD

- 45 testes unitarios dos services (ProjectService, TaskService, UserService)
- 83 testes de integracao via Supertest (projects, tasks, users, auth, MSW)
- 11 testes E2E smoke tests com fetch nativo contra servidor real
- Pipeline GitHub Actions: 3 jobs (test, build, e2e)
- 5 ADRs documentadas (in-memory, Vitest, Express, local vs deploy, E2E strategy)

### Fase 4 — Documentacao e Ebook

- 6 capitulos do ebook em markdown (introducao, arquitetura, API, testes, IA, conclusao)
- Script de geracao de PDF (scripts/generate-ebook.ts) com md-to-pdf
- Ebook final gerado: docs/taskflow-api-poc.pdf
- Fix do erro de compilacao TypeScript em swagger.ts
- CHANGELOG.md e revisao final com metricas
