export interface IRepository<T> {
  findAll(filters?: Partial<T>): T[];
  findById(id: string): T | undefined;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T;
  update(id: string, data: Partial<T>): T | undefined;
  delete(id: string): boolean;
  clear(): void;
}
