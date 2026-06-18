import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../../../src/services/TaskService.js';
import { TaskStatus, Priority } from '../../../src/models/Task.js';
import { ProjectStatus } from '../../../src/models/Project.js';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/utils/errors.js';
import type { Task } from '../../../src/models/Task.js';
import type { Project } from '../../../src/models/Project.js';

const makeTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Task de Teste',
  description: 'Descrição da task',
  status: TaskStatus.TODO,
  priority: Priority.MEDIUM,
  assigneeId: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: 'proj-1',
  name: 'Projeto Teste',
  description: 'Descrição',
  status: ProjectStatus.ACTIVE,
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockTaskRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  findByProjectId: vi.fn(),
  countByStatus: vi.fn(),
};

const mockProjectRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  findByOwnerId: vi.fn(),
};

const mockUserRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  findByEmail: vi.fn(),
};

let service: TaskService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new TaskService(mockTaskRepo as any, mockProjectRepo as any, mockUserRepo as any);
});

describe('TaskService', () => {
  describe('findById', () => {
    it('deve retornar a task quando encontrada', () => {
      const task = makeTask();
      mockTaskRepo.findById.mockReturnValue(task);

      const result = service.findById('task-1');

      expect(result).toEqual(task);
    });

    it('deve lançar NotFoundError quando a task não existe', () => {
      mockTaskRepo.findById.mockReturnValue(undefined);

      expect(() => service.findById('inexistente')).toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('deve criar task com sucesso em projeto ACTIVE', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      const created = makeTask();
      mockProjectRepo.findById.mockReturnValue(project);
      mockTaskRepo.create.mockReturnValue(created);

      const result = service.create({
        projectId: 'proj-1',
        title: 'Nova Task',
        priority: Priority.HIGH,
      });

      expect(result).toEqual(created);
      expect(mockTaskRepo.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        title: 'Nova Task',
        description: '',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        assigneeId: undefined,
      });
    });

    it('deve lançar ConflictError quando projeto está ARCHIVED', () => {
      const project = makeProject({ status: ProjectStatus.ARCHIVED });
      mockProjectRepo.findById.mockReturnValue(project);

      expect(() =>
        service.create({ projectId: 'proj-1', title: 'Task', priority: Priority.LOW }),
      ).toThrow(ConflictError);
      expect(mockTaskRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError quando projectId não existe', () => {
      mockProjectRepo.findById.mockReturnValue(undefined);

      expect(() =>
        service.create({ projectId: 'inexistente', title: 'Task', priority: Priority.LOW }),
      ).toThrow(NotFoundError);
    });

    it('deve validar que o assigneeId existe quando fornecido', () => {
      const project = makeProject();
      mockProjectRepo.findById.mockReturnValue(project);
      mockUserRepo.findById.mockReturnValue(undefined);

      expect(() =>
        service.create({ projectId: 'proj-1', title: 'Task', priority: Priority.LOW, assigneeId: 'user-fake' }),
      ).toThrow(NotFoundError);
      expect(() =>
        service.create({ projectId: 'proj-1', title: 'Task', priority: Priority.LOW, assigneeId: 'user-fake' }),
      ).toThrow('Responsável não encontrado');
    });
  });

  describe('updateStatus', () => {
    it('deve permitir transição válida TODO → IN_PROGRESS', () => {
      const task = makeTask({ status: TaskStatus.TODO });
      const updated = makeTask({ status: TaskStatus.IN_PROGRESS });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue(updated);

      const result = service.updateStatus('task-1', TaskStatus.IN_PROGRESS);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(mockTaskRepo.update).toHaveBeenCalledWith('task-1', { status: TaskStatus.IN_PROGRESS });
    });

    it('deve permitir transição válida IN_PROGRESS → DONE', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS });
      const updated = makeTask({ status: TaskStatus.DONE });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue(updated);

      const result = service.updateStatus('task-1', TaskStatus.DONE);

      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('deve permitir transição válida TODO → CANCELLED', () => {
      const task = makeTask({ status: TaskStatus.TODO });
      const updated = makeTask({ status: TaskStatus.CANCELLED });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue(updated);

      const result = service.updateStatus('task-1', TaskStatus.CANCELLED);

      expect(result.status).toBe(TaskStatus.CANCELLED);
    });

    it('deve permitir transição válida IN_PROGRESS → CANCELLED', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS });
      const updated = makeTask({ status: TaskStatus.CANCELLED });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue(updated);

      const result = service.updateStatus('task-1', TaskStatus.CANCELLED);

      expect(result.status).toBe(TaskStatus.CANCELLED);
    });

    it.each([
      { from: TaskStatus.TODO, to: TaskStatus.DONE, desc: 'TODO → DONE' },
      { from: TaskStatus.DONE, to: TaskStatus.IN_PROGRESS, desc: 'DONE → IN_PROGRESS' },
      { from: TaskStatus.DONE, to: TaskStatus.TODO, desc: 'DONE → TODO' },
      { from: TaskStatus.CANCELLED, to: TaskStatus.TODO, desc: 'CANCELLED → TODO' },
      { from: TaskStatus.CANCELLED, to: TaskStatus.IN_PROGRESS, desc: 'CANCELLED → IN_PROGRESS' },
    ])('deve lançar ValidationError para transição inválida $desc', ({ from, to }) => {
      const task = makeTask({ status: from });
      mockTaskRepo.findById.mockReturnValue(task);

      expect(() => service.updateStatus('task-1', to)).toThrow(ValidationError);
      expect(mockTaskRepo.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError quando a task não existe', () => {
      mockTaskRepo.findById.mockReturnValue(undefined);

      expect(() => service.updateStatus('inexistente', TaskStatus.IN_PROGRESS)).toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('deve atualizar a task corretamente', () => {
      const task = makeTask();
      const updated = makeTask({ title: 'Título Atualizado' });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue(updated);

      const result = service.update('task-1', { title: 'Título Atualizado' });

      expect(result.title).toBe('Título Atualizado');
      expect(mockTaskRepo.update).toHaveBeenCalledWith('task-1', { title: 'Título Atualizado' });
    });

    it('deve lançar NotFoundError quando a task não existe', () => {
      mockTaskRepo.findById.mockReturnValue(undefined);

      expect(() => service.update('inexistente', { title: 'X' })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deve deletar a task com sucesso quando status não é IN_PROGRESS', () => {
      const task = makeTask({ status: TaskStatus.TODO });
      mockTaskRepo.findById.mockReturnValue(task);

      service.delete('task-1');

      expect(mockTaskRepo.delete).toHaveBeenCalledWith('task-1');
    });

    it('deve lançar ConflictError quando status é IN_PROGRESS', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS });
      mockTaskRepo.findById.mockReturnValue(task);

      expect(() => service.delete('task-1')).toThrow(ConflictError);
      expect(() => service.delete('task-1')).toThrow('Não é possível deletar task em andamento');
      expect(mockTaskRepo.delete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError quando a task não existe', () => {
      mockTaskRepo.findById.mockReturnValue(undefined);

      expect(() => service.delete('inexistente')).toThrow(NotFoundError);
    });
  });
});
