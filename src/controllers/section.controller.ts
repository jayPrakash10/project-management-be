import type { Request, Response } from 'express';
import type { ProjectParams, SectionParams } from '../types/params';
import * as sectionService from '../services/section.service';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendNoContent, sendOk } from '../utils/response';
import type { CreateSectionInput, UpdateSectionInput } from '../validators/section.validator';

export async function list(req: Request<ProjectParams>, res: Response): Promise<void> {
  sendOk(res, await sectionService.listSections(getAuthUser(req), req.params.projectId));
}

export async function create(req: Request<ProjectParams>, res: Response): Promise<void> {
  const input: CreateSectionInput = req.body;
  sendCreated(res, await sectionService.createSection(getAuthUser(req), req.params.projectId, input));
}

export async function update(req: Request<SectionParams>, res: Response): Promise<void> {
  const input: UpdateSectionInput = req.body;
  sendOk(res, await sectionService.updateSection(getAuthUser(req), req.params.sectionId, input));
}

export async function remove(req: Request<SectionParams>, res: Response): Promise<void> {
  await sectionService.deleteSection(getAuthUser(req), req.params.sectionId);
  sendNoContent(res);
}
