import type { Request, Response } from 'express';
import type { ProjectParams } from '../types/params';
import * as projectService from '../services/project.service';
import { buildPaginationMeta } from '../utils/pagination';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendNoContent, sendOk, sendPaginated } from '../utils/response';
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from '../validators/project.validator';

export async function list(req: Request, res: Response): Promise<void> {
  const query: ListProjectsQuery = res.locals.query;
  const { items, total } = await projectService.listProjects(getAuthUser(req), query);
  sendPaginated(res, items, buildPaginationMeta(query, total));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input: CreateProjectInput = req.body;
  sendCreated(res, await projectService.createProject(getAuthUser(req), input));
}

export async function getById(req: Request<ProjectParams>, res: Response): Promise<void> {
  sendOk(res, await projectService.getProject(getAuthUser(req), req.params.projectId));
}

export async function update(req: Request<ProjectParams>, res: Response): Promise<void> {
  const input: UpdateProjectInput = req.body;
  sendOk(res, await projectService.updateProject(getAuthUser(req), req.params.projectId, input));
}

export async function remove(req: Request<ProjectParams>, res: Response): Promise<void> {
  await projectService.deleteProject(getAuthUser(req), req.params.projectId);
  sendNoContent(res);
}
