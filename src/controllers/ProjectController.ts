import type { Request, Response, NextFunction } from 'express';
import type { ProjectService } from '../services/ProjectService.js';
import type { ProjectStatus } from '../models/Project.js';
import { success, created, noContent } from '../utils/response.js';

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const filters: { status?: ProjectStatus } = {};
      if (req.query.status) {
        filters.status = req.query.status as ProjectStatus;
      }
      const projects = this.projectService.findAll(filters);
      success(res, projects);
    } catch (error) {
      next(error);
    }
  };

  show = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const project = this.projectService.findById(req.params.id);
      success(res, project);
    } catch (error) {
      next(error);
    }
  };

  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const project = this.projectService.create(req.body);
      created(res, project);
    } catch (error) {
      next(error);
    }
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const project = this.projectService.update(req.params.id, req.body);
      success(res, project);
    } catch (error) {
      next(error);
    }
  };

  partialUpdate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const project = this.projectService.update(req.params.id, req.body);
      success(res, project);
    } catch (error) {
      next(error);
    }
  };

  destroy = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.projectService.delete(req.params.id);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
