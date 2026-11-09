import type { Request, Response } from 'express';
import type { ProjectParams, TaskParams } from '../types/params';
import * as taskService from '../services/task.service';
import { buildPaginationMeta } from '../utils/pagination';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendNoContent, sendOk, sendPaginated } from '../utils/response';
import type {
  AssignTaskInput,
  CreateTaskInput,
  ListMyTasksQuery,
  ListProjectTasksQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../validators/task.validator';

export async function listForProject(req: Request<ProjectParams>, res: Response): Promise<void> {
  const query: ListProjectTasksQuery = res.locals.query;
  const { items, total } = await taskService.listProjectTasks(getAuthUser(req), req.params.projectId, query);
  sendPaginated(res, items, buildPaginationMeta(query, total));
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const query: ListMyTasksQuery = res.locals.query;
  const { items, total } = await taskService.listMyTasks(getAuthUser(req), query);
  sendPaginated(res, items, buildPaginationMeta(query, total));
}

export async function create(req: Request<ProjectParams>, res: Response): Promise<void> {
  const input: CreateTaskInput = req.body;
  sendCreated(res, await taskService.createTask(getAuthUser(req), req.params.projectId, input));
}

export async function getById(req: Request<TaskParams>, res: Response): Promise<void> {
  sendOk(res, await taskService.getTask(getAuthUser(req), req.params.taskId));
}

export async function update(req: Request<TaskParams>, res: Response): Promise<void> {
  const input: UpdateTaskInput = req.body;
  sendOk(res, await taskService.updateTask(getAuthUser(req), req.params.taskId, input));
}

export async function assign(req: Request<TaskParams>, res: Response): Promise<void> {
  const { assigneeId }: AssignTaskInput = req.body;
  sendOk(res, await taskService.assignTask(getAuthUser(req), req.params.taskId, assigneeId));
}

export async function changeStatus(req: Request<TaskParams>, res: Response): Promise<void> {
  const { status }: UpdateTaskStatusInput = req.body;
  sendOk(res, await taskService.changeStatus(getAuthUser(req), req.params.taskId, status));
}

export async function remove(req: Request<TaskParams>, res: Response): Promise<void> {
  await taskService.deleteTask(getAuthUser(req), req.params.taskId);
  sendNoContent(res);
}
