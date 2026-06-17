
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentDTO {
  content: string;
}
