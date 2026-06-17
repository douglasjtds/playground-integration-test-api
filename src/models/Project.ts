
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description: string;
  ownerId: string;
}

export type UpdateProjectDTO = Partial<CreateProjectDTO & { status: ProjectStatus }>;
