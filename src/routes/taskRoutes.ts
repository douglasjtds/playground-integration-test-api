import { Router } from 'express';
import type { TaskController } from '../controllers/TaskController.js';
import type { AuthService } from '../services/AuthService.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../utils/validator.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, createCommentSchema } from '../utils/schemas.js';

export function createTaskRoutes(taskController: TaskController, authService: AuthService): Router {
  const router = Router();
  const auth = authenticate(authService);

  /**
   * @swagger
   * /tasks:
   *   get:
   *     summary: Lista tasks com filtros opcionais
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: projectId
   *         schema: { type: string }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [TODO, IN_PROGRESS, DONE, CANCELLED] }
   *       - in: query
   *         name: priority
   *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
   *     responses:
   *       200: { description: Lista de tasks }
   *       401: { description: Não autenticado }
   */
  router.get('/', auth, taskController.index);

  /**
   * @swagger
   * /tasks/{id}:
   *   get:
   *     summary: Busca task por ID
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Task encontrada }
   *       404: { description: Task não encontrada }
   */
  router.get('/:id', auth, taskController.show);

  router.post('/', auth, validateBody(createTaskSchema), taskController.create);
  router.put('/:id', auth, validateBody(updateTaskSchema), taskController.update);
  router.patch('/:id/status', auth, validateBody(updateTaskStatusSchema), taskController.updateStatus);
  router.delete('/:id', auth, taskController.destroy);

  // Rotas de comentários vinculados a uma task
  router.get('/:id/comments', auth, taskController.listComments);
  router.post('/:id/comments', auth, validateBody(createCommentSchema), taskController.addComment);
  router.delete('/:id/comments/:commentId', auth, taskController.removeComment);

  return router;
}
