import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}
