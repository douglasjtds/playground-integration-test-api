import type { Task, CreateTaskDTO, UpdateTaskDTO } from '../models/Task.js';
import { TaskStatus, Priority, VALID_STATUS_TRANSITIONS } from '../models/Task.js';
import { ProjectStatus } from '../models/Project.js';
import type { TaskRepository } from '../repositories/TaskRepository.js';
import type { ProjectRepository } from '../repositories/ProjectRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private projectRepo: ProjectRepository,
    private userRepo: UserRepository,
  ) {}

  /**
   * Retorna tasks com filtros opcionais.
   */
  findAll(filters?: { projectId?: string; status?: TaskStatus; priority?: Priority; assigneeId?: string }): Task[] {
    return this.taskRepo.findAll(filters as Partial<Task>);
  }

  /**
   * Busca uma task pelo ID.
   * @throws NotFoundError se a task não existir
   */
  findById(id: string): Task {
    const task = this.taskRepo.findById(id);
    if (!task) throw new NotFoundError('Task não encontrada');
    return task;
  }

  /**
   * Cria uma nova task.
   * @throws NotFoundError se o projeto não existir
   * @throws ConflictError se o projeto estiver ARCHIVED
   */
  create(data: CreateTaskDTO): Task {
    const project = this.projectRepo.findById(data.projectId);
    if (!project) throw new NotFoundError('Projeto não encontrado');
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new ConflictError('Não é possível criar tasks em projeto arquivado');
    }

    if (data.assigneeId) {
      const assignee = this.userRepo.findById(data.assigneeId);
      if (!assignee) throw new NotFoundError('Responsável não encontrado');
    }

    return this.taskRepo.create({
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? '',
      status: TaskStatus.TODO,
      priority: data.priority,
      assigneeId: data.assigneeId,
    });
  }

  /**
   * Atualiza parcialmente uma task (sem alterar projectId).
   * @throws NotFoundError se a task não existir
   */
  update(id: string, data: UpdateTaskDTO): Task {
    const task = this.taskRepo.findById(id);
    if (!task) throw new NotFoundError('Task não encontrada');

    const updated = this.taskRepo.update(id, data);
    return updated!;
  }

  /**
   * Atualiza o status de uma task respeitando as transições válidas.
   * @throws NotFoundError se a task não existir
   * @throws ValidationError se a transição de status não for permitida
   */
  updateStatus(id: string, newStatus: TaskStatus): Task {
    const task = this.taskRepo.findById(id);
    if (!task) throw new NotFoundError('Task não encontrada');

    const allowedTransitions = VALID_STATUS_TRANSITIONS[task.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Transição de status inválida: ${task.status} → ${newStatus}`,
        [`Transições permitidas a partir de ${task.status}: ${allowedTransitions.join(', ') || 'nenhuma'}`],
      );
    }

    const updated = this.taskRepo.update(id, { status: newStatus });
    return updated!;
  }

  /**
   * Remove uma task.
   * @throws NotFoundError se a task não existir
   * @throws ConflictError se a task estiver IN_PROGRESS
   */
  delete(id: string): void {
    const task = this.taskRepo.findById(id);
    if (!task) throw new NotFoundError('Task não encontrada');

    if (task.status === TaskStatus.IN_PROGRESS) {
      throw new ConflictError('Não é possível deletar task em andamento');
    }

    this.taskRepo.delete(id);
  }
}
