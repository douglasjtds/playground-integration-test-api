import type { Comment, CreateCommentDTO } from '../models/Comment.js';
import type { CommentRepository } from '../repositories/CommentRepository.js';
import type { TaskRepository } from '../repositories/TaskRepository.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export class CommentService {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  /**
   * Retorna todos os comentários de uma task.
   * @throws NotFoundError se a task não existir
   */
  findByTaskId(taskId: string): Comment[] {
    const task = this.taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task não encontrada');
    return this.commentRepo.findByTaskId(taskId);
  }

  /**
   * Cria um comentário em uma task.
   * @throws NotFoundError se a task não existir
   */
  create(taskId: string, authorId: string, data: CreateCommentDTO): Comment {
    const task = this.taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task não encontrada');

    return this.commentRepo.create({
      taskId,
      authorId,
      content: data.content,
    });
  }

  /**
   * Remove um comentário.
   * @throws NotFoundError se o comentário não existir
   * @throws ForbiddenError se o solicitante não for o autor
   */
  delete(id: string, requesterId: string): void {
    const comment = this.commentRepo.findById(id);
    if (!comment) throw new NotFoundError('Comentário não encontrado');

    if (comment.authorId !== requesterId) {
      throw new ForbiddenError('Apenas o autor pode deletar este comentário');
    }

    this.commentRepo.delete(id);
  }
}
