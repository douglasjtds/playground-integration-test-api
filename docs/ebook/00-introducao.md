# Introdução

## O Problema

Em projetos de longa duração com APIs escaláveis, o maior custo de manutenção não é escrever o código — é manter a suíte de testes confiável enquanto a API evolui. Rotas mudam, regras de negócio crescem, integrações externas aparecem. Sem uma estratégia clara, os testes ficam para trás ou viram obstáculo.

Esta POC nasceu de uma pergunta estratégica do time:

> **"Como vamos testar nossas APIs no futuro — tanto local quanto em deploy — à medida que o projeto cresce?"**

A resposta tradicional envolve containers Docker, bancos de dados reais e pipelines complexas de CI/CD. Nós escolhemos um caminho diferente: **repositórios in-memory, zero dependências externas e inteligência artificial como parte ativa do fluxo de qualidade.**

## O Que Você Vai Aprender

Ao longo deste documento, vamos percorrer toda a jornada de construção de uma API REST completa — do scaffold inicial ao ebook que você está lendo agora. Cada capítulo cobre uma dimensão do projeto:

1. **Arquitetura** — como a separação em 3 camadas (Controller → Service → Repository) facilita os testes
2. **API e Rotas** — as 23 rotas implementadas, suas regras de negócio e exemplos de uso
3. **Estratégia de Testes** — a pirâmide de testes adotada, o padrão `createTestApp()` e como tudo roda no CI/CD
4. **IA nos Testes** — como o Claude Code CLI foi usado para gerar testes a partir de prompts conversacionais
5. **Conclusão** — métricas finais, lições aprendidas e próximos passos para produção

## Stack Técnica

A escolha de cada ferramenta foi guiada por um princípio: **simplicidade operacional**. Nada que exija instalação de sistema, containers ou configuração manual de serviços.

| Camada | Ferramenta | Justificativa |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript 5 | Padrão de mercado, tipagem estática |
| Framework HTTP | Express 4 | Estável, amplamente documentado |
| Validação | Zod | Integração nativa com TypeScript |
| Test Runner | Vitest | ESM-native, mais rápido que Jest |
| Testes HTTP | Supertest | Padrão para integração em Node.js |
| Mocking externo | MSW v2 | Intercepta requests sem adapters |
| Dados de teste | @faker-js/faker | Fixtures realistas e repetíveis |
| IA para testes | Claude Code CLI | Geração de testes via prompts |
| Docs API | Swagger UI | OpenAPI 3.0 documentado inline |
| PDF | md-to-pdf | Geração do ebook final |

## Como Navegar

Este documento foi projetado para ser lido em ordem, mas cada capítulo é autossuficiente. Se você já conhece a arquitetura, pule direto para o **Capítulo 3** (Estratégia de Testes). Se quer ver os resultados da IA, vá ao **Capítulo 4**.

O código-fonte completo está disponível no repositório. Cada decisão arquitetural está documentada como ADR (Architecture Decision Record) no arquivo `docs/architecture/decisions.md`.

---

*Domínio fictício (TaskFlow) escolhido para maximizar variedade de rotas, regras de negócio e casos de teste. A estratégia apresentada é aplicável a qualquer API REST em Node.js.*
