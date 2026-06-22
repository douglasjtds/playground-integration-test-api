/**
 * Cliente HTTP para testes E2E — usa fetch nativo (Node 20+).
 *
 * Diferente do Supertest, este cliente faz requests HTTP reais contra um
 * servidor rodando em uma porta real, validando a camada de rede completa.
 */

import process from "node:process";

/** URL base do servidor. Configurável via variável de ambiente para rodar contra staging. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/** Resposta padronizada retornada pela função api(). */
interface ApiResponse {
  status: number;
  data: any;
}

/**
 * Faz uma requisição HTTP ao servidor e retorna status + body parseado.
 *
 * @param method - Método HTTP (GET, POST, PUT, PATCH, DELETE)
 * @param path - Caminho da rota (ex: '/health', '/auth/register')
 * @param body - Body da requisição (opcional, serializado como JSON)
 * @param token - Token JWT para o header Authorization (opcional)
 * @returns Objeto com status code e body parseado
 */
export async function api(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string,
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    // Respostas sem body (ex: 204 No Content) não têm JSON para parsear
  }

  return { status: response.status, data };
}
