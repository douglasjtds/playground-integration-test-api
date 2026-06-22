# Arquitetura

## Visão Geral

A TaskFlow API segue uma arquitetura em 3 camadas com injeção de dependência. Cada camada tem uma responsabilidade clara e não conhece os detalhes de implementação das camadas adjacentes.

```
Request HTTP
      │
      ▼
┌──────────────────┐
│   Middlewares     │  JWT auth, Zod validation, CORS, Helmet, Logger
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Controllers     │  Extrai dados do request, chama service, retorna response
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Services       │  Regras de negócio, validações de domínio, orquestra repos
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Repositories    │  Acesso a dados — in-memory (testes) ou SQL (produção)
└──────────────────┘
```

## Por Que Cada Camada Existe

### Controllers

Os controllers são a fronteira HTTP da aplicação. Eles extraem dados de `req.params`, `req.body` e `req.query`, delegam para o service correspondente e formatam a resposta usando helpers padronizados (`success()`, `created()`, `noContent()`).

**Regra fundamental:** nenhuma lógica de negócio vive aqui. Se um controller precisa de um `if` que não seja para extrair dados, o código pertence ao service.

### Services

Os services concentram todas as regras de negócio. O `TaskService.updateStatus()`, por exemplo, valida se a transição de status é permitida consultando `VALID_STATUS_TRANSITIONS` antes de persistir a mudança. O `ProjectService.delete()` verifica se existem tasks ativas antes de permitir a exclusão.

**Regra fundamental:** services não importam nada do Express. Seus parâmetros são DTOs tipados, não `req`/`res`.

### Repositories

Os repositories abstraem o acesso a dados por trás de uma interface genérica `IRepository<T>`. Na POC, a implementação usa `Map<string, T>` para armazenamento in-memory. Em produção, a mesma interface seria implementada com queries SQL ou um ORM.

**Regra fundamental:** cada implementação de repository é substituível. O mesmo código de service roda com dados in-memory nos testes e com PostgreSQL em produção.

## Injeção de Dependência

Todas as camadas recebem suas dependências via construtor. A função `createApp()` em `src/app.ts` é a raiz da composição:

```
createApp(repositories?)
  └── cria Services com os repositories
       └── cria Controllers com os services
            └── registra rotas com os controllers
```

Nos testes, `createTestApp()` chama `createApp()` com repositórios frescos a cada invocação — garantindo isolamento total entre testes.

## Tratamento de Erros

A aplicação define uma hierarquia de erros customizados que mapeia diretamente para códigos HTTP:

| Classe | Status | Uso |
|---|---|---|
| `NotFoundError` | 404 | Recurso não encontrado |
| `ValidationError` | 400 | Dados inválidos (com lista de erros) |
| `UnauthorizedError` | 401 | Autenticação ausente ou inválida |
| `ForbiddenError` | 403 | Permissão insuficiente |
| `ConflictError` | 409 | Duplicata ou conflito de estado |

O middleware `errorHandler` captura qualquer erro lançado nas camadas inferiores, identifica o tipo e retorna a resposta HTTP apropriada com formato padronizado.

## Decisões Arquiteturais (ADRs)

As decisões mais relevantes estão documentadas como ADRs no repositório:

- **ADR-001:** Repositórios in-memory em vez de Docker — elimina dependências externas para rodar testes, com a contrapartida de não testar queries SQL reais.
- **ADR-002:** Vitest em vez de Jest — suporte nativo a ESM e TypeScript, API compatível com Jest, configuração mais simples.
- **ADR-003:** Express em vez de Fastify — familiaridade da comunidade, vasta documentação, foco da POC é em testes e não em performance.
- **ADR-004:** Estratégia local vs deploy — testes em camadas com `BASE_URL` configurável, os mesmos smoke tests rodam contra localhost ou staging.
- **ADR-005:** Smoke tests leves — ~10 testes E2E cobrindo o caminho crítico em vez de duplicar toda a suíte de integração.

Cada ADR segue o formato: Contexto → Decisão → Consequências (positivas e negativas).
