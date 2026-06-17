/**
 * Factory function do Express — cria e configura a aplicação.
 * Aceita repositórios como parâmetro para permitir injeção em testes.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

/** Cria uma instância configurada do Express */
export function createApp(repositories?: unknown) {
  const app = express();

  // Middlewares globais
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  // Rota de health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Placeholder: rotas da API serão registradas no Passo 1.5

  // Middleware 404 para rotas não mapeadas
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Rota não encontrada',
    });
  });

  return app;
}
