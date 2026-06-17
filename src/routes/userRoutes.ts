import { Router } from 'express';
import type { UserController } from '../controllers/UserController.js';
import type { AuthService } from '../services/AuthService.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../utils/validator.js';
import { updateUserSchema } from '../utils/schemas.js';

export function createUserRoutes(userController: UserController, authService: AuthService): Router {
  const router = Router();
  const auth = authenticate(authService);

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Lista todos os usuários
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista de usuários }
   *       401: { description: Não autenticado }
   */
  router.get('/', auth, userController.index);

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Busca usuário por ID
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Usuário encontrado }
   *       404: { description: Usuário não encontrado }
   */
  router.get('/:id', auth, userController.show);

  router.put('/:id', auth, validateBody(updateUserSchema), userController.update);
  router.patch('/:id', auth, validateBody(updateUserSchema), userController.partialUpdate);
  router.delete('/:id', auth, userController.destroy);

  return router;
}
