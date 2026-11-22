import { describe, expect, it } from 'vitest'

import { offsetOf, paginated } from './pagination'

describe('paginated', () => {
  it('computes the number of pages', () => {
    expect(paginated(['a'], 41, { page: 1, limit: 20 }).meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 41,
      totalPages: 3,
    })
  })

  it('has zero pages when there is nothing', () => {
    expect(paginated([], 0, { page: 1, limit: 20 }).meta.totalPages).toBe(0)
  })
})

describe('offsetOf', () => {
  it('turns a 1-based page into an offset', () => {
    expect(offsetOf({ page: 1, limit: 20 })).toBe(0)
    expect(offsetOf({ page: 3, limit: 20 })).toBe(40)
  })
})
