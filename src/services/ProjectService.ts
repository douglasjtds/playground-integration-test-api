import type { Project, CreateProjectDTO, UpdateProjectDTO } from '../models/Project.js';
import { ProjectStatus } from '../models/Project.js';
import { TaskStatus } from '../models/Task.js';
import type { ProjectRepository } from '../repositories/ProjectRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { TaskRepository } from '../repositories/TaskRepository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private userRepo: UserRepository,
    private taskRepo?: TaskRepository,
  ) {}

  /**
   * Retorna todos os projetos, com filtro opcional por status.
   */
  findAll(filters?: { status?: ProjectStatus }): Project[] {
    return this.projectRepo.findAll(filters);
  }

  /**
   * Busca um projeto pelo ID.
   * @throws NotFoundError se o projeto não existir
   */
  findById(id: string): Project {
    const project = this.projectRepo.findById(id);
    if (!project) throw new NotFoundError('Projeto não encontrado');
    return project;
  }

  /**
   * Cria um novo projeto.
   * @throws NotFoundError se o ownerId não existir
   */
  create(data: CreateProjectDTO): Project {
    const owner = this.userRepo.findById(data.ownerId);
    if (!owner) throw new NotFoundError('Proprietário não encontrado');

    return this.projectRepo.create({
      name: data.name,
      description: data.description,
      status: ProjectStatus.ACTIVE,
      ownerId: data.ownerId,
    });
  }

  /**
   * Atualiza parcialmente um projeto.
   * @throws NotFoundError se o projeto não existir
   */
  update(id: string, data: UpdateProjectDTO): Project {
    const project = this.projectRepo.findById(id);
    if (!project) throw new NotFoundError('Projeto não encontrado');

    const updated = this.projectRepo.update(id, data);
    return updated!;
  }

  /**
   * Remove um projeto.
   * @throws NotFoundError se o projeto não existir
   * @throws ConflictError se o projeto tiver tasks ativas (TODO ou IN_PROGRESS)
   */
  delete(id: string): void {
    const project = this.projectRepo.findById(id);
    if (!project) throw new NotFoundError('Projeto não encontrado');

    if (this.taskRepo) {
      const tasks = this.taskRepo.findByProjectId(id);
      const activeTasks = tasks.filter(
        (t) => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS,
      );
      if (activeTasks.length > 0) {
        throw new ConflictError('Não é possível deletar projeto com tasks ativas');
      }
    }

    this.projectRepo.delete(id);
  }
}
