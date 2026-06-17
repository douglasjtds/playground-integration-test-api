import { createHash } from 'node:crypto';
import type { CreateUserDTO, UpdateUserDTO, UserPublic } from '../models/User.js';
import { UserRole } from '../models/User.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { TaskRepository } from '../repositories/TaskRepository.js';
import { TaskStatus } from '../models/Task.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';

/** Remove o passwordHash de um User, retornando UserPublic */
function toPublic(user: { id: string; name: string; email: string; passwordHash: string; role: UserRole; createdAt: Date; updatedAt: Date }): UserPublic {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

/** Hash simples da senha usando SHA-256 (sem bcrypt para evitar dependência nativa) */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private taskRepo?: TaskRepository,
  ) {}

  /**
   * Retorna todos os usuários sem o campo passwordHash.
   */
  findAll(): UserPublic[] {
    return this.userRepo.findAll().map(toPublic);
  }

  /**
   * Busca um usuário pelo ID.
   * @throws NotFoundError se o usuário não existir
   */
  findById(id: string): UserPublic {
    const user = this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return toPublic(user);
  }

  /**
   * Cria um novo usuário.
   * @throws ConflictError se o email já estiver cadastrado
   */
  create(data: CreateUserDTO): UserPublic {
    const existing = this.userRepo.findByEmail(data.email);
    if (existing) throw new ConflictError('Email já cadastrado');

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash: hashPassword(data.password),
      role: data.role ?? UserRole.MEMBER,
    });

    return toPublic(user);
  }

  /**
   * Atualiza parcialmente um usuário.
   * @throws NotFoundError se o usuário não existir
   */
  update(id: string, data: UpdateUserDTO): UserPublic {
    const user = this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password !== undefined) updateData.passwordHash = hashPassword(data.password);

    const updated = this.userRepo.update(id, updateData);
    return toPublic(updated!);
  }

  /**
   * Remove um usuário.
   * @throws NotFoundError se o usuário não existir
   * @throws ForbiddenError se o usuário tiver tasks IN_PROGRESS
   */
  delete(id: string): void {
    const user = this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    if (this.taskRepo) {
      const tasks = this.taskRepo.findAll({ assigneeId: id, status: TaskStatus.IN_PROGRESS });
      if (tasks.length > 0) {
        throw new ForbiddenError('Não é possível deletar usuário com tasks em andamento');
      }
    }

    this.userRepo.delete(id);
  }
}

export { hashPassword, toPublic };
