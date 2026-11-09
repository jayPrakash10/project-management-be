import type { Request, Response } from 'express';
import type { ProjectMemberParams, ProjectParams } from '../types/params';
import * as memberService from '../services/member.service';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendNoContent, sendOk } from '../utils/response';
import type { AddMemberInput } from '../validators/project.validator';

export async function list(req: Request<ProjectParams>, res: Response): Promise<void> {
  sendOk(res, await memberService.listMembers(getAuthUser(req), req.params.projectId));
}

export async function add(req: Request<ProjectParams>, res: Response): Promise<void> {
  const { email }: AddMemberInput = req.body;
  sendCreated(res, await memberService.addMember(getAuthUser(req), req.params.projectId, email));
}

export async function remove(req: Request<ProjectMemberParams>, res: Response): Promise<void> {
  await memberService.removeMember(getAuthUser(req), req.params.projectId, req.params.userId);
  sendNoContent(res);
}
