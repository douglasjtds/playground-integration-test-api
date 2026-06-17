
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserPublic = Omit<User, 'passwordHash'>;

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'email'>>;
