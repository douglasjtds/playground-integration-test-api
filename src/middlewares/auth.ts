import type { Request, Response, NextFunction } from 'express';
import type { AuthPayload } from '../models/Auth.js';
import type { UserRole } from '../models/User.js';
import type { AuthService } from '../services/AuthService.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/** Extende o Request do Express para incluir o payload do usuário autenticado */
export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

/**
 * Cria middleware que verifica o token JWT no header Authorization.
 * Adiciona req.user com o payload decodificado.
 */
export function authenticate(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw new UnauthorizedError('Token não fornecido');
      }

      const token = header.slice(7);
      const payload = authService.verifyToken(token);
      (req as AuthenticatedRequest).user = payload;
      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        next(error);
      } else {
        next(new UnauthorizedError('Token inválido ou expirado'));
      }
    }
  };
}

/**
 * Cria middleware que verifica se o usuário autenticado possui um dos roles permitidos.
 * Deve ser usado após o middleware authenticate.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return next(new UnauthorizedError('Não autenticado'));
    }
    if (!roles.includes(user.role as UserRole)) {
      return next(new ForbiddenError('Acesso negado — role insuficiente'));
    }
    next();
  };
}
