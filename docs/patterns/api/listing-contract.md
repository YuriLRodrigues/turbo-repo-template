# Listing contract

Every list of the API has the same shape, in every layer.

In: `page` (1-based, default 1) and `limit` (1 to 100, default 20), plus the filters of that list:

```
GET /notes?page=2&limit=12&archived=true&search=bread
```

Out: the page and how many there are.

```json
{
  "results": [{ "id": "…", "title": "Bread recipe" }],
  "meta": { "page": 2, "limit": 12, "totalItems": 13, "totalPages": 2 }
}
```

- The query DTO extends `PaginationQueryDto`; the use case receives `PaginationParams` plus its filters; the
  repository returns `Paginated<T>` (`core/pagination/pagination.ts`, `paginated()` and `offsetOf()`).
- The order is part of the contract and is stable: it always ends with the id (`desc(notes.updatedAt), desc(notes.id)`)
  so two rows with the same date never swap between pages.
- A list only ever has the caller's rows (rule 0.4). An admin list is a route of its own (`GET /users`,
  `@Roles('ADMIN')`).
- A free-text search matches with `ilike` and `containsPattern()` (`infra/database/drizzle/like-pattern.ts`), which
  escapes `%`, `_` and `\`; a blank search means no search.
- The response DTO of a page has `results` and `meta` (`PaginationMetaDto`); the view model has a `toHttpPage`.
