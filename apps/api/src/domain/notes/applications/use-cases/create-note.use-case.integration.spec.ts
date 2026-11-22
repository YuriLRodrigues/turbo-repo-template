import { beforeEach, describe, expect, it } from 'vitest'

import { TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { CreateNoteUseCase } from './create-note.use-case'

describe('CreateNoteUseCase (rule 2.1)', () => {
  let world: NotesWorld
  let sut: CreateNoteUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new CreateNoteUseCase(world.notesRepository, world.clock)
  })

  it('writes a note of the person who asks', async () => {
    const result = await sut.execute({ actor: world.owner, title: '  Weekly  plan ', body: ' Monday\nTuesday ' })

    if (result.isLeft()) throw result.value
    const { note } = result.value
    expect(note.ownerId.toString()).toBe(world.owner.id)
    expect(note.title.value).toBe('Weekly plan')
    expect(note.body).toBe('Monday\nTuesday')
    expect(note.pinned).toBe(false)
    expect(note.createdAt).toEqual(TEST_NOW)
    expect(world.notesRepository.items).toEqual([note])
  })

  it('can start pinned, and without a body', async () => {
    const result = await sut.execute({ actor: world.owner, title: 'Pinned', body: '   ', pinned: true })

    if (result.isLeft()) throw result.value
    expect(result.value.note.pinned).toBe(true)
    expect(result.value.note.body).toBeNull()
  })

  it.each([
    ['an empty title', { title: '   ' }, InvalidNoteTitleError],
    ['a title over 120 characters', { title: 'a'.repeat(121) }, InvalidNoteTitleError],
    ['a body over 10 000 characters', { title: 'Long', body: 'a'.repeat(10_001) }, InvalidNoteBodyError],
  ])('refuses %s and saves nothing', async (_label, input, error) => {
    const result = await sut.execute({ actor: world.owner, ...input })

    expect(result.value).toBeInstanceOf(error)
    expect(world.notesRepository.items).toHaveLength(0)
  })
})
