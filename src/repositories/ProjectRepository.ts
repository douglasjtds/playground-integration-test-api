import { v4 as uuid } from 'uuid';
import type { Project } from '../models/Project.js';
import type { IRepository } from './interfaces/IRepository.js';

export class ProjectRepository implements IRepository<Project> {
  private projects: Map<string, Project> = new Map();

  findAll(filters?: Partial<Project>): Project[] {
    let results = Array.from(this.projects.values());

    if (filters) {
      results = results.filter((project) =>
        Object.entries(filters).every(
          ([key, value]) => project[key as keyof Project] === value,
        ),
      );
    }

    return results;
  }

  findById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  findByOwnerId(ownerId: string): Project[] {
    return Array.from(this.projects.values()).filter(
      (project) => project.ownerId === ownerId,
    );
  }

  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = new Date();
    const project: Project = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  update(id: string, data: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated: Project = {
      ...project,
      ...data,
      id: project.id,
      createdAt: project.createdAt,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.projects.delete(id);
  }

  clear(): void {
    this.projects.clear();
  }
}
