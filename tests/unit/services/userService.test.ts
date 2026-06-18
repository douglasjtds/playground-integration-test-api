import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/services/UserService.js';
import { UserRole } from '../../../src/models/User.js';
import { TaskStatus } from '../../../src/models/Task.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../src/utils/errors.js';
import type { User } from '../../../src/models/User.js';

const makeUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@test.com',
  passwordHash: 'hash-abc123',
  role: UserRole.MEMBER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

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

let service: UserService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new UserService(mockUserRepo as any, mockTaskRepo as any);
});

describe('UserService', () => {
  describe('findAll', () => {
    it('deve retornar todos os usuários sem passwordHash', () => {
      const users = [makeUser(), makeUser({ id: 'user-2', email: 'maria@test.com' })];
      mockUserRepo.findAll.mockReturnValue(users);

      const result = service.findAll();

      expect(result).toHaveLength(2);
      result.forEach((u) => {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).toHaveProperty('id');
        expect(u).toHaveProperty('name');
        expect(u).toHaveProperty('email');
        expect(u).toHaveProperty('role');
      });
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário sem passwordHash quando encontrado', () => {
      const user = makeUser();
      mockUserRepo.findById.mockReturnValue(user);

      const result = service.findById('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('user-1');
      expect(result.name).toBe('João Silva');
    });

    it('deve lançar NotFoundError quando o usuário não existe', () => {
      mockUserRepo.findById.mockReturnValue(undefined);

      expect(() => service.findById('inexistente')).toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('deve criar usuário com sucesso', () => {
      const created = makeUser();
      mockUserRepo.findByEmail.mockReturnValue(undefined);
      mockUserRepo.create.mockReturnValue(created);

      const result = service.create({
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'senha123',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('user-1');
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@test.com',
          role: UserRole.MEMBER,
        }),
      );
      // Verifica que a senha foi hashada (não é a senha em texto puro)
      const callArg = mockUserRepo.create.mock.calls[0][0];
      expect(callArg.passwordHash).toBeDefined();
      expect(callArg.passwordHash).not.toBe('senha123');
    });

    it('deve lançar ConflictError quando email já existe', () => {
      mockUserRepo.findByEmail.mockReturnValue(makeUser());

      expect(() =>
        service.create({ name: 'Outro', email: 'joao@test.com', password: 'senha123' }),
      ).toThrow(ConflictError);
      expect(() =>
        service.create({ name: 'Outro', email: 'joao@test.com', password: 'senha123' }),
      ).toThrow('Email já cadastrado');
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('deve usar role MEMBER como padrão quando não informado', () => {
      mockUserRepo.findByEmail.mockReturnValue(undefined);
      mockUserRepo.create.mockReturnValue(makeUser());

      service.create({ name: 'Teste', email: 'teste@test.com', password: '123' });

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.MEMBER }),
      );
    });

    it('deve respeitar o role informado', () => {
      mockUserRepo.findByEmail.mockReturnValue(undefined);
      mockUserRepo.create.mockReturnValue(makeUser({ role: UserRole.ADMIN }));

      service.create({ name: 'Admin', email: 'admin@test.com', password: '123', role: UserRole.ADMIN });

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar os dados do usuário', () => {
      const user = makeUser();
      const updated = makeUser({ name: 'Nome Atualizado' });
      mockUserRepo.findById.mockReturnValue(user);
      mockUserRepo.update.mockReturnValue(updated);

      const result = service.update('user-1', { name: 'Nome Atualizado' });

      expect(result.name).toBe('Nome Atualizado');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('deve lançar NotFoundError quando o usuário não existe', () => {
      mockUserRepo.findById.mockReturnValue(undefined);

      expect(() => service.update('inexistente', { name: 'X' })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deve deletar o usuário com sucesso quando não tem tasks em andamento', () => {
      const user = makeUser();
      mockUserRepo.findById.mockReturnValue(user);
      mockTaskRepo.findAll.mockReturnValue([]);

      service.delete('user-1');

      expect(mockUserRepo.delete).toHaveBeenCalledWith('user-1');
    });

    it('deve lançar ForbiddenError quando usuário tem tasks IN_PROGRESS', () => {
      const user = makeUser();
      mockUserRepo.findById.mockReturnValue(user);
      mockTaskRepo.findAll.mockReturnValue([
        { id: 't-1', assigneeId: 'user-1', status: TaskStatus.IN_PROGRESS },
      ]);

      expect(() => service.delete('user-1')).toThrow(ForbiddenError);
      expect(() => service.delete('user-1')).toThrow('Não é possível deletar usuário com tasks em andamento');
      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError quando o usuário não existe', () => {
      mockUserRepo.findById.mockReturnValue(undefined);

      expect(() => service.delete('inexistente')).toThrow(NotFoundError);
    });
  });
});
