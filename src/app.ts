/**
 * Factory function do Express — cria e configura a aplicação.
 * Aceita repositórios como parâmetro para permitir injeção em testes.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRepositories, type Repositories } from './repositories/index.js';
import { UserService } from './services/UserService.js';
import { ProjectService } from './services/ProjectService.js';
import { TaskService } from './services/TaskService.js';
import { CommentService } from './services/CommentService.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ProjectController } from './controllers/ProjectController.js';
import { TaskController } from './controllers/TaskController.js';
import { registerRoutes } from './routes/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';

/** Cria uma instância configurada do Express */
export function createApp(repositories?: Repositories) {
  const repos = repositories ?? createRepositories();

  // Services
  const userService = new UserService(repos.userRepo, repos.taskRepo);
  const projectService = new ProjectService(repos.projectRepo, repos.userRepo, repos.taskRepo);
  const taskService = new TaskService(repos.taskRepo, repos.projectRepo, repos.userRepo);
  const commentService = new CommentService(repos.commentRepo, repos.taskRepo);
  const authService = new AuthService(repos.userRepo);

  // Controllers
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const projectController = new ProjectController(projectService);
  const taskController = new TaskController(taskService, commentService);

  const app = express();

  // Middlewares globais
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(requestLogger);

  // Rota de health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Swagger UI
  setupSwagger(app);

  // Rotas da API
  registerRoutes(
    app,
    { authController, userController, projectController, taskController },
    authService,
  );

  // Middlewares de erro (devem ser os últimos)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
