import { beforeEach, describe, expect, it } from 'vitest'

import { NoteTitle } from '@domain/notes/enterprise/value-objects/note-title'
import { MINUTE, TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { NoteArchivedError } from '../../errors/note-archived.error'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { UpdateNoteUseCase } from './update-note.use-case'

describe('UpdateNoteUseCase (rules 2.1 to 2.3)', () => {
  let world: NotesWorld
  let sut: UpdateNoteUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new UpdateNoteUseCase(world.notesRepository, world.clock)
  })

  it('changes only what was sent and records when', async () => {
    const note = world.storedNote({ title: NoteTitle.restore('Groceries'), body: 'Milk' })
    world.clock.advance(MINUTE)

    const result = await sut.execute({ actor: world.owner, noteId: note.id.toString(), pinned: true })

    if (result.isLeft()) throw result.value
    expect(result.value.note.title.value).toBe('Groceries')
    expect(result.value.note.body).toBe('Milk')
    expect(result.value.note.pinned).toBe(true)
    expect(result.value.note.updatedAt).toEqual(new Date(TEST_NOW.getTime() + MINUTE))
  })

  it('renames, rewrites and clears the body', async () => {
    const note = world.storedNote({ body: 'Milk' })

    await sut.execute({ actor: world.owner, noteId: note.id.toString(), title: 'Shopping', body: null })

    const [saved] = world.notesRepository.items
    expect(saved.title.value).toBe('Shopping')
    expect(saved.body).toBeNull()
  })

  it('changes nothing when one field is invalid', async () => {
    const note = world.storedNote({ title: NoteTitle.restore('Groceries') })

    const result = await sut.execute({
      actor: world.owner,
      noteId: note.id.toString(),
      title: 'Shopping',
      body: 'a'.repeat(10_001),
    })

    expect(result.value).toBeInstanceOf(InvalidNoteBodyError)
    expect(world.notesRepository.items[0].title.value).toBe('Groceries')
  })

  it('refuses an invalid title', async () => {
    const note = world.storedNote()

    const result = await sut.execute({ actor: world.owner, noteId: note.id.toString(), title: '' })

    expect(result.value).toBeInstanceOf(InvalidNoteTitleError)
  })

  it('refuses to change an archived note (rule 2.2)', async () => {
    const note = world.storedNote({ archivedAt: TEST_NOW })

    const result = await sut.execute({ actor: world.owner, noteId: note.id.toString(), title: 'New' })

    expect(result.value).toBeInstanceOf(NoteArchivedError)
  })

  it("answers not found for someone else's note (rule 0.4)", async () => {
    const note = world.storedNote()

    const result = await sut.execute({ actor: world.stranger, noteId: note.id.toString(), title: 'Mine now' })

    expect(result.value).toBeInstanceOf(NoteNotFoundError)
  })
})
