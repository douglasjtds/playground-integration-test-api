import { v4 as uuid } from 'uuid';
import type { User } from '../models/User.js';
import type { IRepository } from './interfaces/IRepository.js';

export class UserRepository implements IRepository<User> {
  private users: Map<string, User> = new Map();

  findAll(filters?: Partial<User>): User[] {
    let results = Array.from(this.users.values());

    if (filters) {
      results = results.filter((user) =>
        Object.entries(filters).every(
          ([key, value]) => user[key as keyof User] === value,
        ),
      );
    }

    return results;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    const user: User = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  update(id: string, data: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated: User = {
      ...user,
      ...data,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }

  clear(): void {
    this.users.clear();
  }
}
