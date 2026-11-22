import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { NoteTitle } from '@domain/notes/enterprise/value-objects/note-title'
import { HOUR, TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { ListNotesUseCase } from './list-notes.use-case'

const at = (hours: number) => new Date(TEST_NOW.getTime() + hours * HOUR)

describe('ListNotesUseCase (rules 2.2 and 2.3)', () => {
  let world: NotesWorld
  let sut: ListNotesUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new ListNotesUseCase(world.notesRepository)
  })

  const titlesOf = async (input: Partial<Parameters<ListNotesUseCase['execute']>[0]> = {}) => {
    const result = await sut.execute({ actor: world.owner, page: 1, limit: 20, ...input })

    return result.value.notes.results.map((note) => note.title.value)
  }

  it('lists pinned notes first, then the most recently changed', async () => {
    world.storedNote({ title: NoteTitle.restore('Old'), updatedAt: at(1) })
    world.storedNote({ title: NoteTitle.restore('Pinned'), pinned: true, updatedAt: at(0) })
    world.storedNote({ title: NoteTitle.restore('New'), updatedAt: at(2) })

    expect(await titlesOf()).toEqual(['Pinned', 'New', 'Old'])
  })

  it('keeps the archive apart (rule 2.2)', async () => {
    world.storedNote({ title: NoteTitle.restore('Active') })
    world.storedNote({ title: NoteTitle.restore('Archived'), archivedAt: TEST_NOW })

    expect(await titlesOf()).toEqual(['Active'])
    expect(await titlesOf({ archived: true })).toEqual(['Archived'])
  })

  it('searches the title and the body, ignoring case', async () => {
    world.storedNote({ title: NoteTitle.restore('Groceries'), body: 'Milk and BREAD' })
    world.storedNote({ title: NoteTitle.restore('Bread recipe') })
    world.storedNote({ title: NoteTitle.restore('Trip') })

    expect(await titlesOf({ search: ' bread ' })).toEqual(expect.arrayContaining(['Groceries', 'Bread recipe']))
    expect(await titlesOf({ search: 'bread' })).toHaveLength(2)
    expect(await titlesOf({ search: '   ' })).toHaveLength(3)
  })

  it("never lists someone else's notes (rule 0.4)", async () => {
    world.storedNote({ ownerId: new UniqueEntityId(world.stranger.id) })

    expect(await titlesOf()).toEqual([])
  })

  it('pages the list', async () => {
    for (let index = 0; index < 3; index++) world.storedNote({ updatedAt: at(index) })

    const result = await sut.execute({ actor: world.owner, page: 2, limit: 2 })

    expect(result.value.notes.results).toHaveLength(1)
    expect(result.value.notes.meta).toEqual({ page: 2, limit: 2, totalItems: 3, totalPages: 2 })
  })
})
