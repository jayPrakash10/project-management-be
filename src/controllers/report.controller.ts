import type { Request, Response } from 'express';
import type { ProjectParams } from '../types/params';
import * as reportService from '../services/report.service';
import { buildPaginationMeta, type PageQuery } from '../utils/pagination';
import { getAuthUser } from '../utils/request';
import { sendOk, sendPaginated } from '../utils/response';

export async function summary(req: Request<ProjectParams>, res: Response): Promise<void> {
  sendOk(res, await reportService.getProjectSummary(getAuthUser(req), req.params.projectId));
}

export async function activity(req: Request<ProjectParams>, res: Response): Promise<void> {
  const page: PageQuery = res.locals.query;
  const { items, total } = await reportService.getProjectActivity(getAuthUser(req), req.params.projectId, page);
  sendPaginated(res, items, buildPaginationMeta(page, total));
}
