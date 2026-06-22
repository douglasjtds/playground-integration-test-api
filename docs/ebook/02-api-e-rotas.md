# API e Rotas

## Mapa Completo de Rotas

A TaskFlow API expõe 23 rotas organizadas em 4 domínios. Todas as rotas (exceto autenticação e health check) requerem um token JWT no header `Authorization: Bearer <token>`.

| Método | Path | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | Não | Health check |
| `POST` | `/auth/register` | Não | Registrar novo usuário |
| `POST` | `/auth/login` | Não | Autenticar e obter token |
| `GET` | `/users` | Sim | Listar usuários |
| `GET` | `/users/:id` | Sim | Buscar usuário por ID |
| `PUT` | `/users/:id` | Sim | Atualização completa |
| `PATCH` | `/users/:id` | Sim | Atualização parcial |
| `DELETE` | `/users/:id` | Sim | Deletar usuário |
| `GET` | `/projects` | Sim | Listar projetos (filtro: `?status=`) |
| `GET` | `/projects/:id` | Sim | Buscar projeto por ID |
| `POST` | `/projects` | Sim | Criar projeto |
| `PUT` | `/projects/:id` | Sim | Atualização completa |
| `PATCH` | `/projects/:id` | Sim | Atualização parcial |
| `DELETE` | `/projects/:id` | Sim | Deletar projeto |
| `GET` | `/tasks` | Sim | Listar tasks (filtros: `?projectId=`, `?status=`, `?priority=`) |
| `GET` | `/tasks/:id` | Sim | Buscar task por ID |
| `POST` | `/tasks` | Sim | Criar task |
| `PUT` | `/tasks/:id` | Sim | Atualização completa |
| `PATCH` | `/tasks/:id/status` | Sim | Transição de status |
| `DELETE` | `/tasks/:id` | Sim | Deletar task |
| `GET` | `/tasks/:id/comments` | Sim | Listar comentários |
| `POST` | `/tasks/:id/comments` | Sim | Adicionar comentário |
| `DELETE` | `/tasks/:id/comments/:commentId` | Sim | Deletar comentário |

## Exemplos de Request/Response

### Registrar usuário

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha123"
}
```

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Maria Silva",
      "email": "maria@example.com",
      "role": "MEMBER",
      "createdAt": "2026-06-17T10:00:00.000Z"
    }
  }
}
```

### Criar task e transicionar status

```http
POST /tasks
Authorization: Bearer <token>

{ "projectId": "abc-123", "title": "Implementar login", "priority": "HIGH" }
→ 201 Created (status: TODO)

PATCH /tasks/task-id/status
Authorization: Bearer <token>

{ "status": "IN_PROGRESS" }
→ 200 OK (status: IN_PROGRESS)
```

## Regras de Negócio

### Máquina de estados das Tasks

A rota `PATCH /tasks/:id/status` é a mais rica em regras de negócio. As transições de status seguem um fluxo definido:

```
                ┌──────────────┐
                │     TODO     │
                └──────┬───────┘
                       │
            ┌──────────┼──────────┐
            ▼                     ▼
   ┌─────────────────┐   ┌──────────────┐
   │  IN_PROGRESS    │   │  CANCELLED   │
   └────────┬────────┘   └──────────────┘
            │                     ▲
     ┌──────┼──────┐              │
     ▼             └──────────────┘
┌──────────┐
│   DONE   │
└──────────┘
```

- **TODO → IN_PROGRESS**: permitido
- **IN_PROGRESS → DONE**: permitido
- **TODO ou IN_PROGRESS → CANCELLED**: permitido
- **TODO → DONE**: bloqueado (deve passar por IN_PROGRESS)
- **DONE → qualquer**: bloqueado (estado terminal)
- **CANCELLED → qualquer**: bloqueado (estado terminal)

Transições inválidas retornam `400 Bad Request` com mensagem descritiva.

### Validações de exclusão

- **Deletar projeto**: bloqueado se existem tasks com status TODO ou IN_PROGRESS (retorna 409)
- **Deletar usuário**: bloqueado se o usuário tem tasks IN_PROGRESS (retorna 403)
- **Deletar task**: bloqueado se o status é IN_PROGRESS (retorna 409)
- **Deletar comentário**: apenas o autor pode deletar (retorna 403 para outros)

### Validação de dados

Todas as rotas com body usam schemas Zod para validação. Campos obrigatórios ausentes, tipos incorretos ou valores fora do enum retornam `400 Bad Request` com a lista de erros de validação.

### Documentação interativa

A API disponibiliza uma interface Swagger UI em `GET /api-docs` com todos os endpoints documentados, schemas de request/response e a possibilidade de testar as rotas diretamente pelo navegador.
