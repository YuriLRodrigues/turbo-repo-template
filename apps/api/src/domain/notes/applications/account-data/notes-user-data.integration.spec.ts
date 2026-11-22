import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { NoteTitle } from '@domain/notes/enterprise/value-objects/note-title'
import { HOUR, TEST_NOW } from '@test/time/fake-clock'
import { makeNotesWorld, type NotesWorld } from '@test/worlds/notes-world'

import { NotesUserData } from './notes-user-data'

describe('NotesUserData (rule 1.6)', () => {
  let world: NotesWorld
  let sut: NotesUserData

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new NotesUserData(world.notesRepository)
  })

  it('exports every note of the person, oldest first, archived included', async () => {
    const later = new Date(TEST_NOW.getTime() + HOUR)
    world.storedNote({ title: NoteTitle.restore('Second'), createdAt: later, updatedAt: later, archivedAt: later })
    const first = world.storedNote({ title: NoteTitle.restore('First'), body: 'Body', pinned: true })
    world.storedNote({ ownerId: new UniqueEntityId(world.stranger.id) })

    const exported = await sut.export(world.owner.id)

    expect(sut.section).toBe('notes')
    expect(exported).toEqual({
      notes: [
        {
          id: first.id.toString(),
          title: 'First',
          body: 'Body',
          pinned: true,
          archivedAt: null,
          createdAt: TEST_NOW.toISOString(),
          updatedAt: TEST_NOW.toISOString(),
        },
        expect.objectContaining({ title: 'Second', archivedAt: later.toISOString() }),
      ],
    })
  })

  it("erases the person's notes and nobody else's", async () => {
    world.storedNote()
    world.storedNote({ ownerId: new UniqueEntityId(world.stranger.id) })

    await sut.erase(world.owner.id)

    expect(world.notesRepository.items).toHaveLength(1)
    expect(world.notesRepository.items[0].ownerId.toString()).toBe(world.stranger.id)
  })
})
