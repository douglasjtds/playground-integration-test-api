import type { Request, Response } from 'express';

/** Middleware que responde 404 para rotas não mapeadas */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
}
