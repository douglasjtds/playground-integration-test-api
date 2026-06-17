/**
 * Helpers para respostas HTTP padronizadas.
 * Todas as respostas da API seguem o formato: { success, data?, message?, errors?, meta? }
 */

import type { Response } from 'express';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: string[];
  meta?: Record<string, unknown>;
}

/** Resposta de sucesso (200) */
export function success(res: Response, data: unknown, message?: string, statusCode = 200): void {
  const body: ApiResponse = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

/** Resposta de criação (201) */
export function created(res: Response, data: unknown, message?: string): void {
  const body: ApiResponse = { success: true, data };
  if (message) body.message = message;
  res.status(201).json(body);
}

/** Resposta sem conteúdo (204) */
export function noContent(res: Response): void {
  res.status(204).send();
}

/** Resposta paginada com metadados de paginação */
export function paginated(
  res: Response,
  data: unknown,
  total: number,
  page: number,
  limit: number,
): void {
  const totalPages = Math.ceil(total / limit);
  const body: ApiResponse = {
    success: true,
    data,
    meta: { total, page, limit, totalPages },
  };
  res.status(200).json(body);
}
