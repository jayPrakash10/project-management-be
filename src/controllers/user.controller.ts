import type { Request, Response } from 'express';
import type { UserParams } from '../types/params';
import * as userService from '../services/user.service';
import { buildPaginationMeta } from '../utils/pagination';
import { getAuthUser } from '../utils/request';
import { sendOk, sendPaginated } from '../utils/response';
import type { ListUsersQuery, UpdateRoleInput } from '../validators/user.validator';

export async function list(_req: Request, res: Response): Promise<void> {
  const query: ListUsersQuery = res.locals.query;
  const { items, total } = await userService.listUsers(query);
  sendPaginated(res, items, buildPaginationMeta(query, total));
}

export async function updateRole(req: Request<UserParams>, res: Response): Promise<void> {
  const { role }: UpdateRoleInput = req.body;
  sendOk(res, await userService.changeRole(getAuthUser(req), req.params.userId, role));
}
