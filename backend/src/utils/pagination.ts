export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Calculate offset for SQL queries
 */
export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Generate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    current_page: page,
    total_pages: totalPages,
    total_items: totalItems,
    items_per_page: limit,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
};

/**
 * Validate and sanitize pagination params
 */
export const sanitizePaginationParams = (
  page?: string | number,
  limit?: string | number
): PaginationParams => {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;
  
  let sanitizedPage = DEFAULT_PAGE;
  let sanitizedLimit = DEFAULT_LIMIT;
  
  // Sanitize page
  if (page) {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      sanitizedPage = parsedPage;
    }
  }
  
  // Sanitize limit
  if (limit) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      sanitizedLimit = Math.min(parsedLimit, MAX_LIMIT);
    }
  }
  
  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
  };
};

export default {
  getOffset,
  getPaginationMeta,
  sanitizePaginationParams,
};
