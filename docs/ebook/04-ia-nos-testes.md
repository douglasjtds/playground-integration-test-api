# IA nos Testes

## A Abordagem

Esta POC utilizou o **Claude Code CLI** (Claude como agente de engenharia no terminal) como parte ativa do fluxo de qualidade. Em vez de escrever cada teste manualmente, usamos prompts conversacionais para gerar suítes completas de testes a partir das definições de rota e regras de negócio.

O fluxo foi:

1. **Construir a API primeiro** (Fases 0 e 1) — modelos, repositórios, services, controllers, rotas
2. **Criar a infraestrutura de testes** (Fase 2) — helpers, factories, MSW
3. **Gerar os testes via IA** (Fase 3) — prompts descrevendo os cenários esperados

## Exemplos de Prompts

### Prompt para testes unitários dos services

O prompt descrevia os cenários esperados por service — por exemplo, para o `TaskService`:

> *"Crie testes unitários para o TaskService. Cubra: create em projeto ACTIVE, create em projeto ARCHIVED (ConflictError), updateStatus com transição válida TODO → IN_PROGRESS, transição inválida TODO → DONE (ValidationError), delete com status IN_PROGRESS (ConflictError). Use vi.fn() para mockar repositórios."*

**Resultado:** 21 testes gerados, todos passando na primeira execução. O Claude identificou corretamente os mocks necessários, usou `it.each()` para testar múltiplas transições inválidas e nomeou cada teste em português conforme solicitado.

### Prompt para testes de integração

Para as rotas de Projects, o prompt listava os cenários HTTP esperados:

> *"Crie testes de integração para /projects. GET retorna lista vazia, filtra por status, retorna 401 sem auth. POST cria com 201, retorna 400 sem campos obrigatórios. DELETE retorna 409 com tasks ativas."*

**Resultado:** 19 testes gerados. Na primeira execução, 12 falharam por nomes de propriedade incorretos nos repositórios (`repos.userRepo` vs `repos.userRepository`). Após uma correção pontual, todos passaram.

### Prompt para testes E2E

> *"Crie smoke tests E2E com fetch nativo contra servidor real. Health check, fluxo de auth, fluxo completo projeto → task → transições de status, proteção de rotas sem token."*

**Resultado:** 11 testes gerados. Problema encontrado: a variável `BASE_URL` não era propagada para processos fork do Vitest no Windows. Corrigido adicionando `test.env` no config do Vitest.

## O Que Funcionou Bem

**Velocidade de geração.** A Fase 3 (45 unitários + 83 integração + 11 E2E) foi executada em poucas interações. Escrever 139 testes manualmente levaria significativamente mais tempo.

**Qualidade estrutural.** Os testes gerados seguem boas práticas: `describe` aninhados por método/rota, nomes descritivos, uso correto de `beforeEach`/`afterEach`, assertions com `expect.objectContaining()`.

**Cobertura de edge cases.** Ao listar explicitamente os cenários no prompt, o Claude cobriu sistematicamente cada caso — incluindo cenários de erro e validação que frequentemente são esquecidos em testes manuais.

**Consistência.** Todos os testes seguem o mesmo padrão de organização, nomenclatura e uso dos helpers, criando uma suíte homogênea.

## O Que Precisou de Ajuste

**Nomes de propriedade.** No teste de integração de Projects, o Claude usou `repos.userRepo` em vez de `repos.userRepository`. Isso acontece quando a IA infere nomes com base em convenções genéricas em vez de ler o código-fonte exato.

**Propagação de variáveis de ambiente.** O teste E2E no Windows não propagava `BASE_URL` para forks do Vitest. Embora o Claude tenha gerado o código funcional, o problema era de configuração do runtime — algo que requer execução real para detectar.

**Comportamento da API vs expectativa.** Alguns testes assumiam controle de ownership (MEMBER não pode editar outro user) que a API não implementa. Os testes foram ajustados para refletir o comportamento real.

## Reflexão: Vantagens e Limitações

**A IA é mais eficaz quando recebe contexto preciso.** Prompts que listam os cenários esperados com verbos HTTP e status codes geram testes melhores do que prompts vagos como "teste tudo".

**A IA não substitui a execução.** Problemas de runtime (env vars no Windows, nomes de propriedade incorretos) só aparecem ao rodar os testes. A IA gera a estrutura; o desenvolvedor valida e ajusta.

**Melhor caso de uso:** geração em lote de testes para APIs com rotas CRUD padronizadas, onde os cenários são repetitivos (200, 400, 401, 404, 409). A IA elimina o trabalho mecânico e permite ao desenvolvedor focar nos cenários de negócio que realmente importam.
