/**
 * Entry point da aplicação — inicia o servidor HTTP.
 */

import { createApp } from './app.js';

const PORT = process.env.PORT ?? 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API rodando na porta ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});
