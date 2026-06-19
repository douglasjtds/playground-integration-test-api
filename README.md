# TaskFlow API

[![CI](https://github.com/seu-usuario/playground-integration-test-api/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/playground-integration-test-api/actions/workflows/ci.yml)

POC de testes de integração com IA — API de gerenciamento de projetos e tarefas em Node.js + TypeScript + Express.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **Linguagem:** TypeScript (strict mode)
- **Testes:** Vitest + Supertest + MSW
- **Validação:** Zod
- **Documentação:** Swagger UI (`/api-docs`)

## Instalação

```bash
npm install
cp .env.example .env
```

## Desenvolvimento

```bash
npm run dev          # Inicia o servidor com hot reload
```

O Swagger UI estará disponível em `http://localhost:3000/api-docs`.

## Como rodar os testes

```bash
# Testes unitários (services com mocks)
npm run test

# Testes de integração (rotas HTTP via Supertest)
npm run test:integration

# Todos os testes
npm run test:all

# Cobertura de código
npm run test:coverage
```

### O que cada suíte cobre

| Suíte | Comando | O que testa |
|-------|---------|-------------|
| Unitários | `npm run test` | Lógica de negócio dos services com repositórios mockados |
| Integração | `npm run test:integration` | Rotas HTTP completas (auth, projects, tasks, comments) |

## Estrutura do projeto

```
src/
├── controllers/     # Camada HTTP (req/res)
├── services/        # Regras de negócio
├── repositories/    # Persistência (in-memory)
├── models/          # Tipos, interfaces e DTOs
├── middlewares/      # Auth, error handler, logger
├── routes/          # Definição de rotas Express
├── utils/           # Erros, validação, response helpers
└── config/          # Swagger

tests/
├── unit/            # Testes unitários dos services
└── integration/     # Testes de integração das rotas
    ├── helpers/     # app-factory, data-factory, auth-helper
    └── msw/         # Mock Service Worker para serviços externos
```

## Build

```bash
npm run build        # Compila TypeScript para dist/
npm start            # Inicia o servidor compilado
```

## Decisões arquiteturais

Consulte [docs/architecture/decisions.md](docs/architecture/decisions.md) para os ADRs do projeto.
