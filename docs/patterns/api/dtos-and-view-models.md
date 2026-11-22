# DTOs and view models

## Request DTOs

A class per body or query, with class-validator decorators for the **shape** and Swagger decorators with examples:

```ts
export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Shopping', maxLength: NOTE_TITLE_MAX_LENGTH })
  @Sent()
  @IsString()
  @MaxLength(NOTE_TITLE_MAX_LENGTH * 4)
  title?: string

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  @IsOptional()
  @IsString()
  body?: string | null
}
```

- The global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted`: an unknown field is a 400 (no `ownerId` or
  `role` sneaks in through a body).
- `@Sent()` (`validation/dto-decorators.ts`) is for a PATCH field that can be left out but not emptied: absent keeps
  the value, `null` is refused. `@IsOptional()` lets `null` through: use it where `null` clears (`body: null`).
- Limits in a DTO are generous ceilings against abuse; the real limit is the domain's (422 with a stable code).
- A list query extends `PaginationQueryDto`. A boolean in a query string uses `@QueryFlag()` (`?archived=true`).
- Nullable values need an explicit `type` in `@ApiProperty` (`type: String, nullable: true`): otherwise Swagger writes
  an `object` and the generated client gets the wrong type.

## Response DTOs and view models

An entity never leaves through HTTP. A response DTO describes the JSON for Swagger (and so for the generated client),
and a view model is the only code that builds it:

```ts
export class NoteViewModel {
  static toHttp(note: Note): NoteResponseDto {
    return {
      id: note.id.toString(),
      title: note.title.value,
      body: note.body,
      pinned: note.pinned,
      archivedAt: note.archivedAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }
  }

  static toHttpPage({ results, meta }: Paginated<Note>): NotesPageResponseDto {
    return { results: results.map((note) => NoteViewModel.toHttp(note)), meta }
  }
}
```

- Dates are ISO text; days without a time are `YYYY-MM-DD`; money is an integer of cents.
- Secrets (password hash, token hashes) never leave at all, not even to the owner.
- The owner of a resource is implicit (always the caller): it is not in the response.
