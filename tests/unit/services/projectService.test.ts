import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '../../../src/services/ProjectService.js';
import { ProjectStatus } from '../../../src/models/Project.js';
import { TaskStatus } from '../../../src/models/Task.js';
import { NotFoundError, ConflictError } from '../../../src/utils/errors.js';
import type { Project } from '../../../src/models/Project.js';

// Factories para dados de teste
const makeProject = (overrides?: Partial<Project>): Project => ({
  id: 'proj-1',
  name: 'Projeto Teste',
  description: 'Descrição do projeto',
  status: ProjectStatus.ACTIVE,
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mocks dos repositórios
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

let service: ProjectService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new ProjectService(mockProjectRepo as any, mockUserRepo as any, mockTaskRepo as any);
});

describe('ProjectService', () => {
  describe('findById', () => {
    it('deve retornar o projeto quando encontrado', () => {
      const project = makeProject();
      mockProjectRepo.findById.mockReturnValue(project);

      const result = service.findById('proj-1');

      expect(result).toEqual(project);
      expect(mockProjectRepo.findById).toHaveBeenCalledWith('proj-1');
    });

    it('deve lançar NotFoundError quando o projeto não existe', () => {
      mockProjectRepo.findById.mockReturnValue(undefined);

      expect(() => service.findById('inexistente')).toThrow(NotFoundError);
      expect(() => service.findById('inexistente')).toThrow('Projeto não encontrado');
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os projetos', () => {
      const projects = [makeProject(), makeProject({ id: 'proj-2' })];
      mockProjectRepo.findAll.mockReturnValue(projects);

      const result = service.findAll();

      expect(result).toEqual(projects);
      expect(mockProjectRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('deve filtrar por status', () => {
      const projects = [makeProject({ status: ProjectStatus.ACTIVE })];
      mockProjectRepo.findAll.mockReturnValue(projects);

      const result = service.findAll({ status: ProjectStatus.ACTIVE });

      expect(result).toEqual(projects);
      expect(mockProjectRepo.findAll).toHaveBeenCalledWith({ status: ProjectStatus.ACTIVE });
    });
  });

  describe('create', () => {
    it('deve criar projeto com sucesso quando ownerId é válido', () => {
      const owner = { id: 'user-1', name: 'Dono' };
      const created = makeProject();
      mockUserRepo.findById.mockReturnValue(owner);
      mockProjectRepo.create.mockReturnValue(created);

      const result = service.create({ name: 'Novo Projeto', description: 'Desc', ownerId: 'user-1' });

      expect(result).toEqual(created);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
      expect(mockProjectRepo.create).toHaveBeenCalledWith({
        name: 'Novo Projeto',
        description: 'Desc',
        status: ProjectStatus.ACTIVE,
        ownerId: 'user-1',
      });
    });

    it('deve lançar NotFoundError quando ownerId não existe', () => {
      mockUserRepo.findById.mockReturnValue(undefined);

      expect(() =>
        service.create({ name: 'Projeto', description: 'Desc', ownerId: 'inexistente' }),
      ).toThrow(NotFoundError);
      expect(mockProjectRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar os campos corretamente', () => {
      const project = makeProject();
      const updated = makeProject({ name: 'Nome Atualizado' });
      mockProjectRepo.findById.mockReturnValue(project);
      mockProjectRepo.update.mockReturnValue(updated);

      const result = service.update('proj-1', { name: 'Nome Atualizado' });

      expect(result).toEqual(updated);
      expect(mockProjectRepo.update).toHaveBeenCalledWith('proj-1', { name: 'Nome Atualizado' });
    });

    it('deve lançar NotFoundError quando o projeto não existe', () => {
      mockProjectRepo.findById.mockReturnValue(undefined);

      expect(() => service.update('inexistente', { name: 'X' })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deve deletar o projeto com sucesso quando não há tasks ativas', () => {
      const project = makeProject();
      mockProjectRepo.findById.mockReturnValue(project);
      mockTaskRepo.findByProjectId.mockReturnValue([
        { id: 't-1', status: TaskStatus.DONE },
        { id: 't-2', status: TaskStatus.CANCELLED },
      ]);

      service.delete('proj-1');

      expect(mockProjectRepo.delete).toHaveBeenCalledWith('proj-1');
    });

    it('deve lançar ConflictError quando projeto tem tasks ativas', () => {
      const project = makeProject();
      mockProjectRepo.findById.mockReturnValue(project);
      mockTaskRepo.findByProjectId.mockReturnValue([
        { id: 't-1', status: TaskStatus.IN_PROGRESS },
      ]);

      expect(() => service.delete('proj-1')).toThrow(ConflictError);
      expect(() => service.delete('proj-1')).toThrow('Não é possível deletar projeto com tasks ativas');
      expect(mockProjectRepo.delete).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictError quando projeto tem tasks com status TODO', () => {
      const project = makeProject();
      mockProjectRepo.findById.mockReturnValue(project);
      mockTaskRepo.findByProjectId.mockReturnValue([
        { id: 't-1', status: TaskStatus.TODO },
      ]);

      expect(() => service.delete('proj-1')).toThrow(ConflictError);
    });

    it('deve lançar NotFoundError quando o projeto não existe', () => {
      mockProjectRepo.findById.mockReturnValue(undefined);

      expect(() => service.delete('inexistente')).toThrow(NotFoundError);
    });
  });
});
