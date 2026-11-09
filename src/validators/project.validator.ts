import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { paginationQuerySchema, requireAtLeastOneField, searchSchema, sortOrderSchema } from './common.validator';

const projectFields = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.PROJECT_NAME),
  description: z.string().trim().max(FIELD_LIMITS.DESCRIPTION).nullable().optional(),
});

export const createProjectSchema = projectFields;

export const updateProjectSchema = requireAtLeastOneField(projectFields.partial());

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  search: searchSchema,
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  order: sortOrderSchema,
});

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
