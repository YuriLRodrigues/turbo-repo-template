# Use cases and controllers

## Use case

One class, one public method `execute(input): Promise<Either<Errors, Output>>`, one file named
`<verb>-<noun>.use-case.ts`. Input and output are exported types next to it.

```ts
export type ArchiveNoteInput = { actor: Actor; noteId: string }
export type ArchiveNoteOutput = Either<NoteNotFoundError, { note: Note }>

@Injectable()
export class ArchiveNoteUseCase {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, noteId }: ArchiveNoteInput): Promise<ArchiveNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())

    if (!note.isArchived) {
      note.archive(this.clock.now())
      await this.notesRepository.save(note)
    }

    return right({ note })
  }
}
```

Rules:

- Depends only on abstract classes from `applications/` (repositories, ports) and on `core` (`Clock`), never on infra.
- Receives plain data and the `Actor`; never a DTO, a request or a Nest decorator.
- "Now" comes from the injected `Clock`, never from `new Date()` (see [money and time](./money-and-time.md)).
- Never imports another use case (lint error). Shared logic goes to:
  - a **policy** (pure function in `enterprise/policies/`), like `canAccessNote` or `parseNoteBody`;
  - a **repository method**, when it is a query;
  - a **domain event**, when it is a side effect;
  - a **helper** in `applications/services/`, when it needs repositories (`SessionIssuer`, `AccountLinkSender`).
- The output wraps values in an object (`{ note }`), so adding a field later does not break callers.
- Validate everything first, change afterwards: either the whole change is saved or nothing is
  (`update-note.use-case.ts`).
- More than one write that must happen together goes inside `unitOfWork.run(...)`
  ([contexts and ports](./contexts-and-ports.md)).

## Controller

One controller per endpoint, named `<verb>-<noun>.controller.ts`, with a single `handle` method:

```ts
@ApiTags('notes')
@Controller('notes/:id/archive')
export class ArchiveNoteController {
  constructor(private readonly archiveNote: ArchiveNoteUseCase) {}

  @Patch()
  @ApiOperation({ summary: 'Archive one of my notes', description: 'Rule 2.2. ...' })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiPrivate('bad-request', new NoteNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<NoteResponseDto> {
    const result = await this.archiveNote.execute({ actor, noteId: id })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
```

Three useful lines: call, throw on `Left`, map with the view model. No business rule, no repository, no `try/catch`.

Documentation is part of the route:

- `@ApiOperation` with a summary and the rule it implements;
- the response DTO (with examples);
- `@ApiPrivate(...)` (padlock + 401) or `@ApiErrors(...)` for a public route, with **one error instance per code** the
  route can answer: `new NoteNotFoundError()`, plus the transport errors (`'validation'`, `'bad-request'`,
  `'forbidden'`, `'rate-limited'`). The examples in Swagger are then the bodies the API really sends.

The operation id is the controller's name (`ArchiveNoteController` → `archiveNote`), which is the name of the function
in `@workspace/api-client`. Two controllers can never share a name.

Register both in the context's HTTP module (`presentations/http/controllers/<ctx>/<ctx>-http.module.ts`): the
controller in `controllers`, the use case in `providers`. Then `npm run api:openapi` and `npm run api:client` from
the root.
