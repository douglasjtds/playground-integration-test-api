/**
 * Configuração do servidor MSW para testes de integração.
 *
 * O setupServer intercepta requests HTTP no nível de rede (sem precisar de browser),
 * permitindo simular APIs externas de forma transparente durante os testes.
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { v4 as uuid } from 'uuid';
import { handlers } from './handlers.js';

/** Instância do servidor MSW com os handlers padrão */
export const server = setupServer(...handlers);

/**
 * Sobrescreve o handler de email para simular envio com sucesso.
 * Use com server.use() dentro de um teste específico.
 */
export function mockEmailSuccess() {
  return http.post('https://notifications.taskflow.io/send', () => {
    return HttpResponse.json(
      {
        messageId: uuid(),
        status: 'queued',
        deliveredAt: new Date().toISOString(),
      },
      { status: 202 },
    );
  });
}

/**
 * Sobrescreve o handler de email para simular falha no envio.
 * Útil para testar tratamento de erros quando o serviço de email está indisponível.
 */
export function mockEmailFailure() {
  return http.post('https://notifications.taskflow.io/send', () => {
    return HttpResponse.json(
      {
        error: 'Service unavailable',
        message: 'O serviço de email está temporariamente indisponível',
      },
      { status: 503 },
    );
  });
}
