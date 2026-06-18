/**
 * Exemplo de uso do MSW nos testes de integração.
 *
 * Este arquivo demonstra os padrões recomendados para:
 * 1. Usar os handlers padrão do MSW (definidos em handlers.ts)
 * 2. Sobrescrever handlers para cenários específicos (server.use())
 * 3. Usar os helpers mockEmailSuccess() e mockEmailFailure()
 *
 * Os handlers são resetados automaticamente após cada teste via setup.ts,
 * então sobrescritas com server.use() só valem para o teste em que foram chamadas.
 */

import { describe, it, expect } from 'vitest';
import { server, mockEmailSuccess, mockEmailFailure } from './server.js';
import { http, HttpResponse } from 'msw';

describe('MSW — Exemplos de uso', () => {
  describe('Handler padrão de notificação por email', () => {
    it('deve retornar sucesso ao enviar notificação', async () => {
      // O handler padrão já está ativo — basta fazer o fetch
      const response = await fetch('https://notifications.taskflow.io/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'usuario@exemplo.com',
          subject: 'Bem-vindo ao TaskFlow',
          body: 'Sua conta foi criada com sucesso.',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toHaveProperty('messageId');
      expect(data.status).toBe('queued');
    });
  });

  describe('Handler padrão de consulta de CEP', () => {
    it('deve retornar dados de endereço para um CEP válido', async () => {
      const response = await fetch('https://viacep.com.br/ws/01001000/json/');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logradouro');
      expect(data).toHaveProperty('localidade');
      expect(data.uf).toBe('SP');
    });
  });

  describe('Sobrescrita de handler para cenário específico', () => {
    it('deve simular falha no envio de email usando mockEmailFailure()', async () => {
      // Sobrescreve o handler padrão apenas para este teste
      server.use(mockEmailFailure());

      const response = await fetch('https://notifications.taskflow.io/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'usuario@exemplo.com',
          subject: 'Teste',
          body: 'Teste de falha',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toHaveProperty('error', 'Service unavailable');
    });

    it('deve simular sucesso com detalhes extras usando mockEmailSuccess()', async () => {
      server.use(mockEmailSuccess());

      const response = await fetch('https://notifications.taskflow.io/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@exemplo.com',
          subject: 'Relatório',
          body: 'Relatório mensal',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toHaveProperty('deliveredAt');
    });
  });

  describe('Sobrescrita inline com server.use()', () => {
    it('deve permitir criar handler customizado para um teste específico', async () => {
      // Exemplo: sobrescrever o ViaCEP para retornar CEP não encontrado
      server.use(
        http.get('https://viacep.com.br/ws/:cep/json/', () => {
          return HttpResponse.json({ erro: true });
        }),
      );

      const response = await fetch('https://viacep.com.br/ws/00000000/json/');
      const data = await response.json();

      expect(data).toEqual({ erro: true });
    });
  });

  describe('Handler de fallback para requests não mapeados', () => {
    it('deve retornar 500 para URLs externas sem handler específico', async () => {
      const response = await fetch('https://api-desconhecida.com/endpoint');

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
