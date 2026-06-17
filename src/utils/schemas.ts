import { z } from 'zod';
import { UserRole } from '../models/User.js';
import { ProjectStatus } from '../models/Project.js';
import { TaskStatus, Priority } from '../models/Task.js';

// ── Auth ──

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// ── Users ──

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.nativeEnum(UserRole).optional(),
});

// ── Projects ──

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ownerId: z.string().uuid('ownerId deve ser um UUID válido'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ownerId: z.string().uuid('ownerId deve ser um UUID válido'),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const patchProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  ownerId: z.string().uuid('ownerId deve ser um UUID válido').optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

// ── Tasks ──

export const createTaskSchema = z.object({
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority, { errorMap: () => ({ message: 'Prioridade inválida' }) }),
  assigneeId: z.string().uuid('assigneeId deve ser um UUID válido').optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().uuid('assigneeId deve ser um UUID válido').optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, { errorMap: () => ({ message: 'Status inválido' }) }),
});

// ── Comments ──

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo do comentário é obrigatório'),
});
