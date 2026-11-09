import type { Knex } from 'knex';
import { db } from '../config/db';
import type { Comment, PageResult } from '../types/models';
import { getOffset, type PageQuery } from '../utils/pagination';

interface NewComment {
  taskId: string;
  authorId: string;
  body: string;
}

function commentsWithAuthor() {
  return db('comments')
    .join('users as author', 'author.id', 'comments.authorId')
    .select('comments.*', 'author.name as authorName');
}

export function findById(id: string): Promise<Comment | undefined> {
  return commentsWithAuthor().where('comments.id', id).first();
}

// Returns the new comment's id; callers re-read it to include the author's name.
export async function create(comment: NewComment, conn: Knex = db): Promise<string> {
  const [created] = await conn('comments').insert(comment).returning('id');
  return created.id;
}

export async function remove(id: string): Promise<void> {
  await db('comments').where({ id }).delete();
}

export async function listByTask(taskId: string, page: PageQuery): Promise<PageResult<Comment>> {
  const [items, [{ count }]] = await Promise.all([
    commentsWithAuthor()
      .where('comments.taskId', taskId)
      .orderBy('comments.createdAt', 'asc')
      .limit(page.limit)
      .offset(getOffset(page)),
    db('comments').where({ taskId }).count({ count: '*' }),
  ]);
  return { items, total: Number(count) };
}
