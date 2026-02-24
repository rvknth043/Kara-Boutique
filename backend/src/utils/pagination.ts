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


const parsePaginationValue = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (Array.isArray(value) && value.length > 0) {
    return parsePaginationValue(value[0]);
  }

  return null;
};

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
  page?: unknown,
  limit?: unknown
): PaginationParams => {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;
  
  let sanitizedPage = DEFAULT_PAGE;
  let sanitizedLimit = DEFAULT_LIMIT;
  
  // Sanitize page
  if (page) {
    const parsedPage = parsePaginationValue(page);
    if (parsedPage !== null && !isNaN(parsedPage) && parsedPage > 0) {
      sanitizedPage = parsedPage;
    }
  }
  
  // Sanitize limit
  if (limit) {
    const parsedLimit = parsePaginationValue(limit);
    if (parsedLimit !== null && !isNaN(parsedLimit) && parsedLimit > 0) {
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
