import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';

const emailSchema = z.string().trim().toLowerCase().email().max(FIELD_LIMITS.EMAIL);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.USER_NAME),
  email: emailSchema,
  password: z.string().min(FIELD_LIMITS.PASSWORD_MIN).max(FIELD_LIMITS.PASSWORD_MAX),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
