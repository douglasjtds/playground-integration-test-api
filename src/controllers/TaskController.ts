import type { Request, Response, NextFunction } from 'express';
import type { TaskService } from '../services/TaskService.js';
import type { CommentService } from '../services/CommentService.js';
import type { TaskStatus } from '../models/Task.js';
import type { Priority } from '../models/Task.js';
import type { AuthPayload } from '../models/Auth.js';
import { success, created, noContent } from '../utils/response.js';

export class TaskController {
  constructor(
    private taskService: TaskService,
    private commentService: CommentService,
  ) {}

  index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const filters: { projectId?: string; status?: TaskStatus; priority?: Priority; assigneeId?: string } = {};
      if (req.query.projectId) filters.projectId = req.query.projectId as string;
      if (req.query.status) filters.status = req.query.status as TaskStatus;
      if (req.query.priority) filters.priority = req.query.priority as Priority;
      if (req.query.assigneeId) filters.assigneeId = req.query.assigneeId as string;

      const tasks = this.taskService.findAll(filters);
      success(res, tasks);
    } catch (error) {
      next(error);
    }
  };

  show = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const task = this.taskService.findById(req.params.id);
      success(res, task);
    } catch (error) {
      next(error);
    }
  };

  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const task = this.taskService.create(req.body);
      created(res, task);
    } catch (error) {
      next(error);
    }
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const task = this.taskService.update(req.params.id, req.body);
      success(res, task);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const task = this.taskService.updateStatus(req.params.id, req.body.status);
      success(res, task);
    } catch (error) {
      next(error);
    }
  };

  destroy = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.taskService.delete(req.params.id);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };

  listComments = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const comments = this.commentService.findByTaskId(req.params.id);
      success(res, comments);
    } catch (error) {
      next(error);
    }
  };

  addComment = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as Request & { user: AuthPayload }).user;
      const comment = this.commentService.create(req.params.id, user.userId, req.body);
      created(res, comment);
    } catch (error) {
      next(error);
    }
  };

  removeComment = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as Request & { user: AuthPayload }).user;
      this.commentService.delete(req.params.commentId, user.userId);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
