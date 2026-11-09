import type { Request, Response } from 'express';
import { db } from '../config/db';
import { sendOk } from '../utils/response';

// Confirms the API is up and can reach the database (handy right after a Vercel deploy).
export async function check(_req: Request, res: Response): Promise<void> {
  await db.raw('select 1');
  sendOk(res, { status: 'ok', database: 'connected' });
}
