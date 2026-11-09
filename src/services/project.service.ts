import { db } from '../config/db';
import { ACTIVITY_ACTIONS, DEFAULT_SECTION_NAMES } from '../config/constants';
import * as activityRepository from '../repositories/activity.repository';
import * as memberRepository from '../repositories/member.repository';
import * as projectRepository from '../repositories/project.repository';
import * as sectionRepository from '../repositories/section.repository';
import type { AuthUser, PageResult, Project } from '../types/models';
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from '../validators/project.validator';
import { getProjectForManager, getProjectForMember } from './access.service';

export function listProjects(actor: AuthUser, query: ListProjectsQuery): Promise<PageResult<Project>> {
  return projectRepository.list({
    ...query,
    memberUserId: actor.role === 'admin' ? undefined : actor.id,
  });
}

// Creating a project also adds the owner as a member and sets up default
// board sections. A transaction ensures we never end up with half a project.
export function createProject(actor: AuthUser, input: CreateProjectInput): Promise<Project> {
  return db.transaction(async (trx) => {
    const project = await projectRepository.create({ ...input, ownerId: actor.id }, trx);
    await memberRepository.add(project.id, actor.id, trx);
    await sectionRepository.createMany(
      DEFAULT_SECTION_NAMES.map((name, position) => ({ projectId: project.id, name, position })),
      trx,
    );
    await activityRepository.record(
      {
        projectId: project.id,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.PROJECT_CREATED,
        details: { name: project.name },
      },
      trx,
    );
    return project;
  });
}

export function getProject(actor: AuthUser, projectId: string): Promise<Project> {
  return getProjectForMember(projectId, actor);
}

export async function updateProject(actor: AuthUser, projectId: string, input: UpdateProjectInput): Promise<Project> {
  await getProjectForManager(projectId, actor);
  return projectRepository.update(projectId, input);
}

export async function deleteProject(actor: AuthUser, projectId: string): Promise<void> {
  await getProjectForManager(projectId, actor);
  await projectRepository.remove(projectId);
}
