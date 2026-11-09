export interface PageQuery {
  page: number;
  limit: number;
}

export interface PaginationMeta extends PageQuery {
  total: number;
  totalPages: number;
}

export function getOffset({ page, limit }: PageQuery): number {
  return (page - 1) * limit;
}

export function buildPaginationMeta({ page, limit }: PageQuery, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
