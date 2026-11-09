import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(FIELD_LIMITS.COMMENT_BODY),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
