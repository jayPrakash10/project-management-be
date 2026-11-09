import { z } from 'zod';
import { FIELD_LIMITS, PAGINATION, SORT_ORDERS } from '../config/constants';

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const isoDateSchema = z.string().date('Must be a date in YYYY-MM-DD format');

export const searchSchema = z.string().trim().min(1).max(FIELD_LIMITS.SEARCH).optional();

export const sortOrderSchema = z.enum(SORT_ORDERS).default('desc');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const projectIdParamsSchema = z.object({ projectId: uuidSchema });
export const taskIdParamsSchema = z.object({ taskId: uuidSchema });
export const sectionIdParamsSchema = z.object({ sectionId: uuidSchema });
export const commentIdParamsSchema = z.object({ commentId: uuidSchema });
export const userIdParamsSchema = z.object({ userId: uuidSchema });
export const projectMemberParamsSchema = z.object({ projectId: uuidSchema, userId: uuidSchema });

// PATCH bodies must change something.
export function requireAtLeastOneField<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });
}
