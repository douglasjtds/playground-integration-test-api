import { Router } from 'express';
import type { AuthController } from '../controllers/AuthController.js';
import { validateBody } from '../utils/validator.js';
import { createUserSchema, loginSchema } from '../utils/schemas.js';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Registra um novo usuário
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name: { type: string }
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 6 }
   *               role: { type: string, enum: [ADMIN, MEMBER] }
   *     responses:
   *       201: { description: Usuário registrado com sucesso }
   *       400: { description: Dados inválidos }
   *       409: { description: Email já cadastrado }
   */
  router.post('/register', validateBody(createUserSchema), authController.register);

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Autentica um usuário
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200: { description: Login realizado com sucesso }
   *       401: { description: Credenciais inválidas }
   */
  router.post('/login', validateBody(loginSchema), authController.login);

  return router;
}
