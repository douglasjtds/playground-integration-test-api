/**
 * Fábricas de dados para testes de integração.
 *
 * Usa @faker-js/faker para gerar dados realistas.
 * - Funções make*() retornam DTOs prontos para envio via API.
 * - Funções make*Seed() criam e persistem entidades diretamente nos repositórios.
 */

import { faker } from '@faker-js/faker/locale/pt_BR';
import type { CreateUserDTO } from '../../../src/models/User.js';
import { UserRole } from '../../../src/models/User.js';
import type { CreateProjectDTO } from '../../../src/models/Project.js';
import { ProjectStatus } from '../../../src/models/Project.js';
import type { CreateTaskDTO } from '../../../src/models/Task.js';
import { TaskStatus, Priority } from '../../../src/models/Task.js';
import type { CreateCommentDTO } from '../../../src/models/Comment.js';
import type { User } from '../../../src/models/User.js';
import type { Project } from '../../../src/models/Project.js';
import type { Task } from '../../../src/models/Task.js';
import type { UserRepository } from '../../../src/repositories/UserRepository.js';
import type { ProjectRepository } from '../../../src/repositories/ProjectRepository.js';
import type { TaskRepository } from '../../../src/repositories/TaskRepository.js';
import { createHash } from 'node:crypto';

/**
 * Gera um DTO de criação de usuário com dados aleatórios.
 * Campos podem ser sobrescritos via overrides.
 */
export function makeUser(overrides?: Partial<CreateUserDTO>): CreateUserDTO {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    role: UserRole.MEMBER,
    ...overrides,
  };
}

/**
 * Gera um DTO de criação de projeto com dados aleatórios.
 * O campo ownerId deve ser fornecido via overrides ou será um UUID aleatório.
 */
export function makeProject(overrides?: Partial<CreateProjectDTO>): CreateProjectDTO {
  return {
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    ownerId: faker.string.uuid(),
    ...overrides,
  };
}

/**
 * Gera um DTO de criação de task com dados aleatórios.
 * O campo projectId deve ser fornecido via overrides ou será um UUID aleatório.
 */
export function makeTask(overrides?: Partial<CreateTaskDTO>): CreateTaskDTO {
  return {
    projectId: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    description: faker.lorem.paragraph(),
    priority: Priority.MEDIUM,
    ...overrides,
  };
}

/**
 * Gera um DTO de criação de comentário com dados aleatórios.
 */
export function makeComment(overrides?: Partial<CreateCommentDTO>): CreateCommentDTO {
  return {
    content: faker.lorem.paragraph(),
    ...overrides,
  };
}

/**
 * Cria e persiste um usuário diretamente no repositório.
 * Útil para preparar dados de teste sem passar pela API.
 */
export function makeUserSeed(
  repo: UserRepository,
  overrides?: Partial<CreateUserDTO>,
): User {
  const data = makeUser(overrides);
  const passwordHash = createHash('sha256').update(data.password).digest('hex');
  return repo.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role ?? UserRole.MEMBER,
  });
}

/**
 * Cria e persiste um projeto diretamente no repositório.
 * Requer um ownerId válido.
 */
export function makeProjectSeed(
  repo: ProjectRepository,
  ownerId: string,
  overrides?: Partial<CreateProjectDTO>,
): Project {
  const data = makeProject({ ...overrides, ownerId });
  return repo.create({
    name: data.name,
    description: data.description,
    status: ProjectStatus.ACTIVE,
    ownerId: data.ownerId,
  });
}

/**
 * Cria e persiste uma task diretamente no repositório.
 * Requer um projectId válido.
 */
export function makeTaskSeed(
  repo: TaskRepository,
  projectId: string,
  overrides?: Partial<CreateTaskDTO>,
): Task {
  const data = makeTask({ ...overrides, projectId });
  return repo.create({
    projectId: data.projectId,
    title: data.title,
    description: data.description ?? '',
    status: TaskStatus.TODO,
    priority: data.priority,
    assigneeId: data.assigneeId,
  });
}
