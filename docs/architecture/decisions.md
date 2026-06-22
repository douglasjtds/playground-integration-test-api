# Architecture Decision Records (ADRs)

> Registro das decisões arquiteturais do projeto TaskFlow API.

---

## ADR-001: Repositórios in-memory em vez de Docker nos testes

### Contexto

Testes de integração tradicionais frequentemente dependem de containers Docker com bancos de dados reais (PostgreSQL, MongoDB). Isso adiciona complexidade ao setup, tempo de execução e dependência de Docker Desktop na máquina do desenvolvedor.

### Decisão

Usamos repositórios **in-memory** (baseados em `Map<string, T>`) como camada de persistência nos testes. A interface `IRepository<T>` é implementada tanto pelos repositórios in-memory quanto por eventuais repositórios reais, garantindo que o comportamento seja intercambiável.

### Consequências

**Positivas:**
- Zero dependências externas para rodar testes — basta `npm test`
- Execução extremamente rápida (< 2s para toda a suíte unitária)
- Setup trivial no CI/CD — sem Docker, sem banco, sem migrations
- Cada teste cria repositórios frescos via `createTestApp()`, eliminando estado compartilhado

**Negativas:**
- Não testa queries SQL reais, índices ou constraints do banco
- Comportamento de filtros e ordenação pode divergir do banco real
- Para produção, seria necessário adicionar testes com Testcontainers ou banco real

---

## ADR-002: Vitest em vez de Jest

### Contexto

Jest é o framework de testes mais popular no ecossistema Node.js, mas projetos TypeScript com ESM (ECMAScript Modules) frequentemente enfrentam problemas de configuração com Jest — transformações, mocks de módulos ESM e compatibilidade com `"type": "module"`.

### Decisão

Adotamos **Vitest** como framework de testes. O projeto usa `"type": "module"` no package.json e `"module": "NodeNext"` no tsconfig, o que torna o Vitest a escolha natural.

### Consequências

**Positivas:**
- Suporte nativo a ESM e TypeScript sem configuração extra
- API compatível com Jest (`describe`, `it`, `expect`, `vi.fn()`)
- Configuração via `vitest.config.ts` com suporte a múltiplos configs (unitário, integração)
- Hot reload com `vitest --watch` extremamente rápido
- Cobertura integrada via `@vitest/coverage-v8`

**Negativas:**
- Ecossistema de plugins menor que o do Jest
- Equipe pode não ter familiaridade prévia com Vitest
- Algumas bibliotecas de mock (ex: `jest-mock-extended`) não são compatíveis diretamente

---

## ADR-003: Express em vez de Fastify para esta POC

### Contexto

Fastify oferece melhor performance e validação de schema integrada, mas esta POC tem como objetivo demonstrar **práticas de teste**, não performance de framework.

### Decisão

Usamos **Express 4** como framework HTTP. A familiaridade da comunidade com Express reduz a barreira de entrada para quem for ler o código e reproduzir a abordagem.

### Consequências

**Positivas:**
- Framework mais conhecido do ecossistema Node.js — facilita adoção
- Vasta documentação e exemplos disponíveis
- Middleware pattern bem estabelecido e compreendido
- Supertest integra-se nativamente com Express

**Negativas:**
- Performance inferior ao Fastify em cenários de alta carga
- Validação de schema não é nativa (usamos Zod como camada separada)
- Tipagem TypeScript requer `@types/express` e casts manuais em alguns casos

---

## ADR-004: Estratégia de teste local vs deploy (BASE_URL pattern)

### Contexto

Os testes de integração usam Supertest, que injeta requests diretamente no Express app sem abrir uma porta HTTP. Isso é ótimo para velocidade, mas não valida o ambiente real (CORS, variáveis de ambiente, porta).

### Decisão

Adotamos uma estratégia em camadas:

1. **Testes unitários** (`npm run test`): lógica de negócio isolada com mocks
2. **Testes de integração** (`npm run test:integration`): rotas HTTP via Supertest, repositórios in-memory
3. **Testes E2E / smoke** (futuro `npm run test:e2e`): requests HTTP reais contra `BASE_URL`, validando o ambiente completo

O `BASE_URL` é configurável via variável de ambiente, permitindo rodar os mesmos smoke tests contra `localhost:3000` ou contra um ambiente de staging.

### Consequências

**Positivas:**
- Cada camada de teste tem responsabilidade clara
- Testes de integração são rápidos e determinísticos
- Smoke tests validam o deploy real sem duplicar toda a suíte
- CI/CD pode rodar unitários + integração em paralelo, e smoke tests após deploy

**Negativas:**
- Requer manutenção de múltiplas configurações de teste
- Smoke tests dependem de um servidor rodando (setup mais complexo no CI)
- Possível falsa confiança se apenas testes in-memory passam mas o banco real falha

---

## ADR-005: Estratégia E2E — smoke tests leves vs suíte completa

### Contexto

Os testes de integração via Supertest injetam requests diretamente no Express sem abrir uma porta HTTP. Isso não valida problemas reais de deploy: CORS, binding de porta, variáveis de ambiente faltando ou middlewares que dependem da camada de rede. Precisamos validar o ambiente real sem duplicar toda a suíte de integração.

### Decisão

Criamos uma suíte leve de **~10 smoke tests** que fazem requests HTTP reais via `fetch` nativo (Node 20+) contra um servidor rodando em uma porta real. O `BASE_URL` é configurável via variável de ambiente, permitindo rodar os mesmos testes contra `localhost:3000` (desenvolvimento/CI) ou contra um ambiente de staging.

A suíte cobre apenas o **caminho crítico**:
- Health check (servidor está de pé)
- Autenticação (register + login)
- Fluxo completo: projeto → task → transições de status
- Proteção de rotas (401 sem token)

Vitest roda com `pool: 'forks'` e `singleFork: true` para execução sequencial, já que o servidor é estado compartilhado. Não coletamos coverage nos testes E2E.

### Consequências

**Positivas:**
- Valida a superfície real de deploy — captura erros de configuração que Supertest não vê
- Nenhuma dependência extra além de `fetch` nativo e `wait-on` (para CI)
- Reutilizável para validação de staging com uma simples mudança de `BASE_URL`
- Execução rápida (~10 testes vs centenas de integração)

**Negativas:**
- Cobertura de cenários menor que os testes de integração
- Requer servidor rodando (setup mais complexo no CI)
- Estado in-memory é perdido a cada restart — não testa persistência real
- Execução sequencial é mais lenta que paralela
