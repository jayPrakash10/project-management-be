import { db } from '../config/db';
import { ACTIVITY_ACTIONS } from '../config/constants';
import * as activityRepository from '../repositories/activity.repository';
import * as memberRepository from '../repositories/member.repository';
import * as taskRepository from '../repositories/task.repository';
import * as userRepository from '../repositories/user.repository';
import type { AuthUser, ProjectMember } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import { getProjectForManager, getProjectForMember } from './access.service';

export async function listMembers(actor: AuthUser, projectId: string): Promise<ProjectMember[]> {
  await getProjectForMember(projectId, actor);
  return memberRepository.listByProject(projectId);
}

export async function addMember(actor: AuthUser, projectId: string, email: string): Promise<ProjectMember> {
  await getProjectForManager(projectId, actor);
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError('No user found with this email');
  }
  if (await memberRepository.isMember(projectId, user.id)) {
    throw new ConflictError('User is already a member of this project');
  }

  return db.transaction(async (trx) => {
    await memberRepository.add(projectId, user.id, trx);
    await activityRepository.record(
      {
        projectId,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.MEMBER_ADDED,
        details: { userId: user.id, name: user.name },
      },
      trx,
    );
    const member = await memberRepository.findMember(projectId, user.id, trx);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    return member;
  });
}

// Removing a member also unassigns their unfinished tasks so nothing is left
// assigned to someone who can no longer see the project.
export async function removeMember(actor: AuthUser, projectId: string, userId: string): Promise<void> {
  const project = await getProjectForManager(projectId, actor);
  if (userId === project.ownerId) {
    throw new ConflictError('The project owner cannot be removed from the project');
  }
  const member = await memberRepository.findMember(projectId, userId);
  if (!member) {
    throw new NotFoundError('Member not found');
  }

  await db.transaction(async (trx) => {
    await memberRepository.remove(projectId, userId, trx);
    const unassignedTaskCount = await taskRepository.unassignOpenTasks(projectId, userId, trx);
    await activityRepository.record(
      {
        projectId,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
        details: { userId, name: member.name, unassignedTaskCount },
      },
      trx,
    );
  });
}
