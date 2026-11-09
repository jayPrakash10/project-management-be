import type { Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import type { PaginationMeta } from './pagination';

export function sendOk<T>(res: Response, data: T): void {
  res.status(HTTP_STATUS.OK).json({ data });
}

export function sendCreated<T>(res: Response, data: T): void {
  res.status(HTTP_STATUS.CREATED).json({ data });
}

export function sendNoContent(res: Response): void {
  res.status(HTTP_STATUS.NO_CONTENT).send();
}

export function sendPaginated<T>(res: Response, items: T[], meta: PaginationMeta): void {
  res.status(HTTP_STATUS.OK).json({ data: items, meta });
}
