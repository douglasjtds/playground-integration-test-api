import { v4 as uuid } from 'uuid';
import type { Task } from '../models/Task.js';
import { TaskStatus } from '../models/Task.js';
import type { IRepository } from './interfaces/IRepository.js';

export class TaskRepository implements IRepository<Task> {
  private tasks: Map<string, Task> = new Map();

  findAll(filters?: Partial<Task>): Task[] {
    let results = Array.from(this.tasks.values());

    if (filters) {
      results = results.filter((task) =>
        Object.entries(filters).every(
          ([key, value]) => value === undefined || task[key as keyof Task] === value,
        ),
      );
    }

    return results;
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  findByProjectId(projectId: string): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId,
    );
  }

  countByStatus(projectId: string): Record<TaskStatus, number> {
    const counts: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.CANCELLED]: 0,
    };

    for (const task of this.tasks.values()) {
      if (task.projectId === projectId) {
        counts[task.status]++;
      }
    }

    return counts;
  }

  create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const now = new Date();
    const task: Task = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, data: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated: Task = {
      ...task,
      ...data,
      id: task.id,
      createdAt: task.createdAt,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}
