import * as memberRepository from '../repositories/member.repository';
import * as projectRepository from '../repositories/project.repository';
import type { AuthUser, Project } from '../types/models';
import { ForbiddenError, NotFoundError } from '../utils/errors';

// Project-level authorization shared by every service that touches project data.
// Admins can do everything; owners manage their projects; members can work inside them.

export function canManageProject(project: Project, actor: AuthUser): boolean {
  return actor.role === 'admin' || project.ownerId === actor.id;
}

export function assertCanManageProject(project: Project, actor: AuthUser): void {
  if (!canManageProject(project, actor)) {
    throw new ForbiddenError('Only the project owner or an admin can do this');
  }
}

export async function getProjectForMember(projectId: string, actor: AuthUser): Promise<Project> {
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (actor.role !== 'admin' && !(await memberRepository.isMember(projectId, actor.id))) {
    throw new ForbiddenError('You are not a member of this project');
  }
  return project;
}

export async function getProjectForManager(projectId: string, actor: AuthUser): Promise<Project> {
  const project = await getProjectForMember(projectId, actor);
  assertCanManageProject(project, actor);
  return project;
}
