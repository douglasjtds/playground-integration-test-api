export type { IRepository } from './interfaces/IRepository.js';
export { UserRepository } from './UserRepository.js';
export { ProjectRepository } from './ProjectRepository.js';
export { TaskRepository } from './TaskRepository.js';
export { CommentRepository } from './CommentRepository.js';

import { UserRepository } from './UserRepository.js';
import { ProjectRepository } from './ProjectRepository.js';
import { TaskRepository } from './TaskRepository.js';
import { CommentRepository } from './CommentRepository.js';

export function createRepositories() {
  return {
    userRepo: new UserRepository(),
    projectRepo: new ProjectRepository(),
    taskRepo: new TaskRepository(),
    commentRepo: new CommentRepository(),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
