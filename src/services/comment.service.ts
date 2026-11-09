import { db } from '../config/db';
import { ACTIVITY_ACTIONS } from '../config/constants';
import * as activityRepository from '../repositories/activity.repository';
import * as commentRepository from '../repositories/comment.repository';
import type { AuthUser, Comment, PageResult } from '../types/models';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import type { PageQuery } from '../utils/pagination';
import { getTaskForMember } from './task.service';

async function findCommentOrThrow(commentId: string): Promise<Comment> {
  const comment = await commentRepository.findById(commentId);
  if (!comment) {
    throw new NotFoundError('Comment not found');
  }
  return comment;
}

export async function listComments(actor: AuthUser, taskId: string, page: PageQuery): Promise<PageResult<Comment>> {
  await getTaskForMember(actor, taskId);
  return commentRepository.listByTask(taskId, page);
}

export async function addComment(actor: AuthUser, taskId: string, body: string): Promise<Comment> {
  const { task } = await getTaskForMember(actor, taskId);
  const commentId = await db.transaction(async (trx) => {
    const id = await commentRepository.create({ taskId, authorId: actor.id, body }, trx);
    await activityRepository.record(
      { projectId: task.projectId, taskId, actorId: actor.id, action: ACTIVITY_ACTIONS.COMMENT_ADDED },
      trx,
    );
    return id;
  });
  return findCommentOrThrow(commentId);
}

export async function deleteComment(actor: AuthUser, commentId: string): Promise<void> {
  const comment = await findCommentOrThrow(commentId);
  if (actor.role !== 'admin' && comment.authorId !== actor.id) {
    throw new ForbiddenError('You can only delete your own comments');
  }
  await commentRepository.remove(commentId);
}
