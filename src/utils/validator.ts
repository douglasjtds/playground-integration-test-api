/**
 * Wrapper Zod + Express para validação de requests.
 * Cada função retorna um middleware que valida a parte correspondente do request.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from './errors.js';

/** Valida req.body contra o schema Zod fornecido */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError('Erro de validação', messages));
      } else {
        next(error);
      }
    }
  };
}

/** Valida req.query contra o schema Zod fornecido */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError('Erro de validação nos parâmetros de query', messages));
      } else {
        next(error);
      }
    }
  };
}

/** Valida req.params contra o schema Zod fornecido */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError('Parâmetros de rota inválidos', messages));
      } else {
        next(error);
      }
    }
  };
}
