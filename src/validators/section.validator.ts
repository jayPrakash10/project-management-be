import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { requireAtLeastOneField } from './common.validator';

const sectionFields = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.SECTION_NAME),
  position: z.number().int().min(0).optional(),
});

export const createSectionSchema = sectionFields;

export const updateSectionSchema = requireAtLeastOneField(sectionFields.partial());

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
