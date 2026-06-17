import { v4 as uuid } from 'uuid';
import type { Comment } from '../models/Comment.js';
import type { IRepository } from './interfaces/IRepository.js';

export class CommentRepository implements IRepository<Comment> {
  private comments: Map<string, Comment> = new Map();

  findAll(filters?: Partial<Comment>): Comment[] {
    let results = Array.from(this.comments.values());

    if (filters) {
      results = results.filter((comment) =>
        Object.entries(filters).every(
          ([key, value]) => comment[key as keyof Comment] === value,
        ),
      );
    }

    return results;
  }

  findById(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  /** Retorna todos os comentários de uma task */
  findByTaskId(taskId: string): Comment[] {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.taskId === taskId,
    );
  }

  create(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment {
    const now = new Date();
    const comment: Comment = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  update(id: string, data: Partial<Comment>): Comment | undefined {
    const comment = this.comments.get(id);
    if (!comment) return undefined;

    const updated: Comment = {
      ...comment,
      ...data,
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: new Date(),
    };
    this.comments.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.comments.delete(id);
  }

  clear(): void {
    this.comments.clear();
  }
}
