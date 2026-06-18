/**
 * Handlers do MSW (Mock Service Worker) para simular serviços externos.
 *
 * Cada handler intercepta requests HTTP a APIs externas que a TaskFlow API
 * consumiria em produção, evitando chamadas reais durante os testes.
 */

import { http, HttpResponse } from 'msw';
import { v4 as uuid } from 'uuid';

/**
 * Handler para o serviço fictício de notificação por email.
 * Simula o envio de emails transacionais (ex: boas-vindas, redefinição de senha).
 */
const emailNotificationHandler = http.post(
  'https://notifications.taskflow.io/send',
  () => {
    return HttpResponse.json(
      {
        messageId: uuid(),
        status: 'queued',
      },
      { status: 202 },
    );
  },
);

/**
 * Handler para o serviço de busca de CEP via ViaCEP.
 * Retorna dados de endereço mockados para qualquer CEP consultado.
 */
const viaCepHandler = http.get(
  'https://viacep.com.br/ws/:cep/json/',
  ({ params }) => {
    const { cep } = params;
    return HttpResponse.json({
      cep: String(cep).replace(/(\d{5})(\d{3})/, '$1-$2'),
      logradouro: 'Rua das Flores',
      complemento: '',
      unidade: '',
      bairro: 'Centro',
      localidade: 'São Paulo',
      uf: 'SP',
      estado: 'São Paulo',
      regiao: 'Sudeste',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107',
    });
  },
);

/**
 * Handler de fallback — captura qualquer request a URLs externas não mapeadas.
 * Loga um aviso no console e retorna 500, evitando que requests reais escapem
 * acidentalmente durante os testes.
 */
const fallbackHandler = http.all('https://*', ({ request }) => {
  console.warn(
    `[MSW] Request não mapeado interceptado: ${request.method} ${request.url}`,
  );
  return HttpResponse.json(
    { error: 'Request externo não mapeado nos testes' },
    { status: 500 },
  );
});

/** Lista de handlers padrão usados em todos os testes */
export const handlers = [
  emailNotificationHandler,
  viaCepHandler,
  fallbackHandler,
];
