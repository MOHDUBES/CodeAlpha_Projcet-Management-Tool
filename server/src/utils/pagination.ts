export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const parsePagination = (options: PaginationOptions): PaginationResult => {
  const page = Math.max(1, parseInt(String(options.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(options.limit || 20))));
  const skip = (page - 1) * limit;
  const sortField = options.sort || 'createdAt';
  const sortOrder = options.order === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sort: { [sortField]: sortOrder },
  };
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
