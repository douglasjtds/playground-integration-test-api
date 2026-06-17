import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/AuthService.js';
import { success, created } from '../utils/response.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.authService.register(req.body);
      created(res, result, 'Usuário registrado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  login = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.authService.login(req.body);
      success(res, result);
    } catch (error) {
      next(error);
    }
  };
}
