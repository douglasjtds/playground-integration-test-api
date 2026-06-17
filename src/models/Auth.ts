import type { UserPublic, UserRole } from './User.js';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: UserPublic;
}
