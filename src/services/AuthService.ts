import jwt from 'jsonwebtoken';
import type { CreateUserDTO } from '../models/User.js';
import { UserRole } from '../models/User.js';
import type { LoginDTO, AuthPayload, LoginResponse } from '../models/Auth.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { hashPassword, toPublic } from './UserService.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'taskflow-secret-key-poc';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  /**
   * Registra um novo usuário e retorna token + dados públicos.
   */
  register(data: CreateUserDTO): LoginResponse {
    const existing = this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email já cadastrado');
    }

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash: hashPassword(data.password),
      role: data.role ?? UserRole.MEMBER,
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: toPublic(user) };
  }

  /**
   * Autentica um usuário com email e senha.
   * @throws UnauthorizedError se as credenciais forem inválidas
   */
  login(data: LoginDTO): LoginResponse {
    const user = this.userRepo.findByEmail(data.email);
    if (!user) throw new UnauthorizedError('Credenciais inválidas');

    const passwordHash = hashPassword(data.password);
    if (user.passwordHash !== passwordHash) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: toPublic(user) };
  }

  /**
   * Verifica e decodifica um token JWT.
   * @throws UnauthorizedError se o token for inválido ou expirado
   */
  verifyToken(token: string): AuthPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      return payload;
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  }

  private generateToken(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      { userId, email, role } satisfies AuthPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }
}
