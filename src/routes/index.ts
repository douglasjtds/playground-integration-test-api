import type { Express } from 'express';
import type { AuthController } from '../controllers/AuthController.js';
import type { UserController } from '../controllers/UserController.js';
import type { ProjectController } from '../controllers/ProjectController.js';
import type { TaskController } from '../controllers/TaskController.js';
import type { AuthService } from '../services/AuthService.js';
import { createAuthRoutes } from './authRoutes.js';
import { createUserRoutes } from './userRoutes.js';
import { createProjectRoutes } from './projectRoutes.js';
import { createTaskRoutes } from './taskRoutes.js';

interface Controllers {
  authController: AuthController;
  userController: UserController;
  projectController: ProjectController;
  taskController: TaskController;
}

/** Registra todas as rotas da API no Express app */
export function registerRoutes(app: Express, controllers: Controllers, authService: AuthService): void {
  app.use('/auth', createAuthRoutes(controllers.authController));
  app.use('/users', createUserRoutes(controllers.userController, authService));
  app.use('/projects', createProjectRoutes(controllers.projectController, authService));
  app.use('/tasks', createTaskRoutes(controllers.taskController, authService));
}
