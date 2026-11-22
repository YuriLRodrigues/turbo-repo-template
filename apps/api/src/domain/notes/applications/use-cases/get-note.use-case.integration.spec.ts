import { beforeEach, describe, expect, it } from 'vitest'

import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { GetNoteUseCase } from './get-note.use-case'

describe('GetNoteUseCase', () => {
  let world: NotesWorld
  let sut: GetNoteUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new GetNoteUseCase(world.notesRepository)
  })

  it('answers the note of its owner', async () => {
    const note = world.storedNote()

    const result = await sut.execute({ actor: world.owner, noteId: note.id.toString() })

    expect(result.value).toEqual({ note })
  })

  it("answers not found for someone else's note and for one that does not exist (rule 0.4)", async () => {
    const note = world.storedNote()

    expect((await sut.execute({ actor: world.stranger, noteId: note.id.toString() })).value).toBeInstanceOf(
      NoteNotFoundError,
    )
    expect((await sut.execute({ actor: world.owner, noteId: 'missing' })).value).toBeInstanceOf(NoteNotFoundError)
  })
})
