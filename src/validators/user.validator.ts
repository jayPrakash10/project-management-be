import { z } from 'zod';
import { USER_ROLES } from '../config/constants';
import { paginationQuerySchema, searchSchema } from './common.validator';

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: searchSchema,
  role: z.enum(USER_ROLES).optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
