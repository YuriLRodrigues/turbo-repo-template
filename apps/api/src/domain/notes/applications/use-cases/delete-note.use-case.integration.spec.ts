import { beforeEach, describe, expect, it } from 'vitest'

import { TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { DeleteNoteUseCase } from './delete-note.use-case'

describe('DeleteNoteUseCase (rule 2.4)', () => {
  let world: NotesWorld
  let sut: DeleteNoteUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new DeleteNoteUseCase(world.notesRepository)
  })

  it('deletes a note for good, archived or not', async () => {
    const active = world.storedNote()
    const archived = world.storedNote({ archivedAt: TEST_NOW })

    await sut.execute({ actor: world.owner, noteId: active.id.toString() })
    const result = await sut.execute({ actor: world.owner, noteId: archived.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(world.notesRepository.items).toHaveLength(0)
  })

  it("answers not found for someone else's note and keeps it (rule 0.4)", async () => {
    const note = world.storedNote()

    const result = await sut.execute({ actor: world.stranger, noteId: note.id.toString() })

    expect(result.value).toBeInstanceOf(NoteNotFoundError)
    expect(world.notesRepository.items).toHaveLength(1)
  })
})
