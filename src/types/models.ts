import type { ActivityAction, TaskPriority, TaskStatus, UserRole } from '../config/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: Date;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string | null;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}
