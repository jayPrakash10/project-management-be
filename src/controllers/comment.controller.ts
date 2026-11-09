import type { Request, Response } from 'express';
import type { CommentParams, TaskParams } from '../types/params';
import * as commentService from '../services/comment.service';
import { buildPaginationMeta, type PageQuery } from '../utils/pagination';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import type { CreateCommentInput } from '../validators/comment.validator';

export async function list(req: Request<TaskParams>, res: Response): Promise<void> {
  const page: PageQuery = res.locals.query;
  const { items, total } = await commentService.listComments(getAuthUser(req), req.params.taskId, page);
  sendPaginated(res, items, buildPaginationMeta(page, total));
}

export async function create(req: Request<TaskParams>, res: Response): Promise<void> {
  const { body }: CreateCommentInput = req.body;
  sendCreated(res, await commentService.addComment(getAuthUser(req), req.params.taskId, body));
}

export async function remove(req: Request<CommentParams>, res: Response): Promise<void> {
  await commentService.deleteComment(getAuthUser(req), req.params.commentId);
  sendNoContent(res);
}
