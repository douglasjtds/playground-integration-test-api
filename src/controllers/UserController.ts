import type { Request, Response, NextFunction } from 'express';
import type { UserService } from '../services/UserService.js';
import { success, noContent } from '../utils/response.js';

export class UserController {
  constructor(private userService: UserService) {}

  index = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const users = this.userService.findAll();
      success(res, users);
    } catch (error) {
      next(error);
    }
  };

  show = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = this.userService.findById(req.params.id);
      success(res, user);
    } catch (error) {
      next(error);
    }
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = this.userService.update(req.params.id, req.body);
      success(res, user);
    } catch (error) {
      next(error);
    }
  };

  partialUpdate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = this.userService.update(req.params.id, req.body);
      success(res, user);
    } catch (error) {
      next(error);
    }
  };

  destroy = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.userService.delete(req.params.id);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
