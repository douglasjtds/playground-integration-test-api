import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

/**
 * Middleware global de tratamento de erros.
 * Captura todos os erros passados para next(error).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Loga o erro com stack trace em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  // Erros operacionais da aplicação (AppError e subclasses)
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
    };
    if ('errors' in err && Array.isArray((err as { errors: string[] }).errors)) {
      body.errors = (err as { errors: string[] }).errors;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Erros de validação Zod (caso não tenham sido tratados pelo middleware de validação)
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: messages,
    });
    return;
  }

  // Erros desconhecidos — responde 500 sem expor detalhes em produção
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message || 'Erro interno do servidor',
  });
}
