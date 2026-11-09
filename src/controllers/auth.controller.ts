import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendOk } from '../utils/response';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

export async function register(req: Request, res: Response): Promise<void> {
  const input: RegisterInput = req.body;
  sendCreated(res, await authService.register(input));
}

export async function login(req: Request, res: Response): Promise<void> {
  const input: LoginInput = req.body;
  sendOk(res, await authService.login(input));
}

export async function me(req: Request, res: Response): Promise<void> {
  sendOk(res, await authService.getCurrentUser(getAuthUser(req).id));
}
