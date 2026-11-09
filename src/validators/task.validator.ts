import { z } from 'zod';
import { DUE_STATUSES, FIELD_LIMITS, TASK_PRIORITIES, TASK_STATUSES } from '../config/constants';
import {
  isoDateSchema,
  paginationQuerySchema,
  requireAtLeastOneField,
  searchSchema,
  sortOrderSchema,
  uuidSchema,
} from './common.validator';

const titleSchema = z.string().trim().min(1).max(FIELD_LIMITS.TASK_TITLE);
const descriptionSchema = z.string().trim().max(FIELD_LIMITS.DESCRIPTION).nullable();

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  sectionId: uuidSchema.optional(),
  dueDate: isoDateSchema.optional(),
  assigneeId: uuidSchema.optional(),
});

export const updateTaskSchema = requireAtLeastOneField(
  z.object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    sectionId: uuidSchema.nullable().optional(),
    dueDate: isoDateSchema.nullable().optional(),
  }),
);

export const assignTaskSchema = z.object({
  assigneeId: uuidSchema.nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

const taskFilterFields = {
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueStatus: z.enum(DUE_STATUSES).optional(),
  dueBefore: isoDateSchema.optional(),
  dueAfter: isoDateSchema.optional(),
  search: searchSchema,
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('createdAt'),
  order: sortOrderSchema,
};

export const listProjectTasksQuerySchema = paginationQuerySchema.extend({
  ...taskFilterFields,
  assigneeId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
});

export const listMyTasksQuerySchema = paginationQuerySchema.extend({
  ...taskFilterFields,
  projectId: uuidSchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListProjectTasksQuery = z.infer<typeof listProjectTasksQuerySchema>;
export type ListMyTasksQuery = z.infer<typeof listMyTasksQuerySchema>;
