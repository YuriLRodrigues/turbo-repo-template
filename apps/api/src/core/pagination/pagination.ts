/** `page` is 1-based. */
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

/** The only shape a list ever has, in every layer: `{ results, meta }`. */
export interface Paginated<T> {
  results: T[]
  meta: PaginationMeta
}

export function paginated<T>(results: T[], totalItems: number, { page, limit }: PaginationParams): Paginated<T> {
  return { results, meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } }
}

export function offsetOf({ page, limit }: PaginationParams): number {
  return (page - 1) * limit
}
