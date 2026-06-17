/**
 * Classes de erro customizadas da TaskFlow API.
 * Todas estendem AppError, que é a base para tratamento centralizado no errorHandler.
 */

/** Erro base da aplicação — todos os erros operacionais estendem esta classe */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Recurso não encontrado (404) */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

/** Erro de validação (400) — inclui lista de erros detalhados */
export class ValidationError extends AppError {
  public readonly errors: string[];

  constructor(message = 'Dados inválidos', errors: string[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/** Não autenticado (401) */
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 401);
  }
}

/** Sem permissão (403) */
export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}

/** Conflito de recursos (409) — ex: email já cadastrado */
export class ConflictError extends AppError {
  constructor(message = 'Recurso já existe') {
    super(message, 409);
  }
}
