import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DomainEvents } from '@core/events/domain-events'
import { NoteArchivedEvent } from '@domain/notes/enterprise/events/note-archived.event'
import { MINUTE, TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { ArchiveNoteUseCase } from './archive-note.use-case'
import { UnarchiveNoteUseCase } from './unarchive-note.use-case'

describe('ArchiveNoteUseCase and UnarchiveNoteUseCase (rule 2.2)', () => {
  let world: NotesWorld
  let archive: ArchiveNoteUseCase
  let unarchive: UnarchiveNoteUseCase
  let dispatched: NoteArchivedEvent[]

  beforeEach(() => {
    world = makeNotesWorld()
    archive = new ArchiveNoteUseCase(world.notesRepository, world.clock)
    unarchive = new UnarchiveNoteUseCase(world.notesRepository, world.clock)
    dispatched = []
    DomainEvents.register<NoteArchivedEvent>((event) => {
      dispatched.push(event)
    }, NoteArchivedEvent.name)
  })

  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
  })

  it('archives once, unpins, and announces it after the save', async () => {
    const note = world.storedNote({ pinned: true })

    const first = await archive.execute({ actor: world.owner, noteId: note.id.toString() })
    world.clock.advance(MINUTE)
    await archive.execute({ actor: world.owner, noteId: note.id.toString() })

    if (first.isLeft()) throw first.value
    expect(first.value.note.archivedAt).toEqual(TEST_NOW)
    expect(first.value.note.pinned).toBe(false)
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].note.id.equals(note.id)).toBe(true)
  })

  it('brings a note back from the archive, and changes nothing for one that is not there', async () => {
    const archived = world.storedNote({ archivedAt: TEST_NOW })
    const active = world.storedNote()
    world.clock.advance(MINUTE)

    const back = await unarchive.execute({ actor: world.owner, noteId: archived.id.toString() })
    const same = await unarchive.execute({ actor: world.owner, noteId: active.id.toString() })

    if (back.isLeft() || same.isLeft()) throw new Error('expected both to succeed')
    expect(back.value.note.isArchived).toBe(false)
    expect(back.value.note.updatedAt).toEqual(new Date(TEST_NOW.getTime() + MINUTE))
    expect(same.value.note.updatedAt).toEqual(TEST_NOW)
  })

  it("answers not found for someone else's note (rule 0.4)", async () => {
    const note = world.storedNote()

    expect((await archive.execute({ actor: world.stranger, noteId: note.id.toString() })).value).toBeInstanceOf(
      NoteNotFoundError,
    )
    expect((await unarchive.execute({ actor: world.stranger, noteId: note.id.toString() })).value).toBeInstanceOf(
      NoteNotFoundError,
    )
    expect(dispatched).toHaveLength(0)
  })
})
