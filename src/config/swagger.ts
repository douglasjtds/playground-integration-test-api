import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: 'POC de testes de integração com IA — API de gerenciamento de projetos e tarefas',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Servidor local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

/** Registra o Swagger UI na rota /api-docs */
export function setupSwagger(app: Express): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  (app as any).use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
