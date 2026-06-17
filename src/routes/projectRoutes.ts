import { Router } from 'express';
import type { ProjectController } from '../controllers/ProjectController.js';
import type { AuthService } from '../services/AuthService.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../utils/validator.js';
import { createProjectSchema, updateProjectSchema, patchProjectSchema } from '../utils/schemas.js';

export function createProjectRoutes(projectController: ProjectController, authService: AuthService): Router {
  const router = Router();
  const auth = authenticate(authService);

  /**
   * @swagger
   * /projects:
   *   get:
   *     summary: Lista projetos com filtro opcional por status
   *     tags: [Projects]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [ACTIVE, ARCHIVED, COMPLETED] }
   *     responses:
   *       200: { description: Lista de projetos }
   *       401: { description: Não autenticado }
   */
  router.get('/', auth, projectController.index);

  /**
   * @swagger
   * /projects/{id}:
   *   get:
   *     summary: Busca projeto por ID
   *     tags: [Projects]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Projeto encontrado }
   *       404: { description: Projeto não encontrado }
   */
  router.get('/:id', auth, projectController.show);

  router.post('/', auth, validateBody(createProjectSchema), projectController.create);
  router.put('/:id', auth, validateBody(updateProjectSchema), projectController.update);
  router.patch('/:id', auth, validateBody(patchProjectSchema), projectController.partialUpdate);
  router.delete('/:id', auth, projectController.destroy);

  return router;
}
