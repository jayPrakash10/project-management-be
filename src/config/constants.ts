export const USER_ROLES = ['admin', 'manager', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const DEFAULT_USER_ROLE: UserRole = 'member';
export const PROJECT_CREATOR_ROLES: UserRole[] = ['admin', 'manager'];

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const DEFAULT_TASK_STATUS: TaskStatus = 'todo';
export const DONE_STATUS: TaskStatus = 'done';

// Ordered from lowest to highest so the array index doubles as a sort rank.
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium';

export const DUE_STATUSES = ['overdue', 'due_today', 'due_this_week'] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];
export const DAYS_IN_WEEK = 7;

export const DEFAULT_SECTION_NAMES = ['To Do', 'In Progress', 'Done'];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FIELD_LIMITS = {
  USER_NAME: 100,
  EMAIL: 255,
  PASSWORD_MIN: 8,
  // bcrypt only uses the first 72 bytes of a password.
  PASSWORD_MAX: 72,
  PROJECT_NAME: 150,
  SECTION_NAME: 100,
  TASK_TITLE: 200,
  DESCRIPTION: 5000,
  COMMENT_BODY: 2000,
  SEARCH: 100,
} as const;

export const BCRYPT_SALT_ROUNDS = 10;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ACTIVITY_ACTIONS = {
  PROJECT_CREATED: 'project.created',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_UNASSIGNED: 'task.unassigned',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_DELETED: 'task.deleted',
  COMMENT_ADDED: 'comment.added',
} as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];
