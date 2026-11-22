import { describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'

import { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { NoteArchivedEvent } from '../events/note-archived.event'
import { canAccessNote } from '../policies/note-access.policy'
import { parseNoteBody } from '../policies/note-body.policy'
import { NoteTitle } from '../value-objects/note-title'
import { Note } from './note.entity'

const created = new Date('2026-11-14T15:00:00Z')
const later = new Date('2026-11-14T16:00:00Z')

const title = (raw = 'Groceries') => {
  const result = NoteTitle.create(raw)
  if (result.isLeft()) throw result.value

  return result.value
}

const write = () => Note.write({ ownerId: new UniqueEntityId('owner-1'), title: title(), body: null, now: created })

describe('NoteTitle (rule 2.1)', () => {
  it('trims and joins the spaces', () => {
    expect(title('  Weekly   plan ').value).toBe('Weekly plan')
  })

  it.each(['', '   ', 'a'.repeat(121)])('refuses %j', (raw) => {
    expect(NoteTitle.create(raw).value).toBeInstanceOf(InvalidNoteTitleError)
  })

  it('accepts 120 characters', () => {
    expect(title('a'.repeat(120)).value).toHaveLength(120)
  })
})

describe('parseNoteBody (rule 2.1)', () => {
  it('treats blank as no body and keeps the line breaks inside', () => {
    expect(parseNoteBody('   ').value).toBeNull()
    expect(parseNoteBody(null).value).toBeNull()
    expect(parseNoteBody(' first\nsecond ').value).toBe('first\nsecond')
  })

  it('refuses a body over 10 000 characters', () => {
    expect(parseNoteBody('a'.repeat(10_000)).value).toHaveLength(10_000)
    expect(parseNoteBody('a'.repeat(10_001)).value).toBeInstanceOf(InvalidNoteBodyError)
  })
})

describe('Note', () => {
  it('starts not pinned, not archived, changed when it was written', () => {
    const note = write()

    expect(note.pinned).toBe(false)
    expect(note.isArchived).toBe(false)
    expect(note.createdAt).toEqual(created)
    expect(note.updatedAt).toEqual(created)
  })

  it('records when it changes', () => {
    const note = write()

    note.rename(title('Shopping'), later)

    expect(note.title.value).toBe('Shopping')
    expect(note.updatedAt).toEqual(later)
  })

  it('does not change when it is pinned twice (rule 2.3)', () => {
    const note = write()
    note.setPinned(true, later)

    note.setPinned(true, new Date('2026-11-15T00:00:00Z'))

    expect(note.updatedAt).toEqual(later)
  })

  it('is unpinned and raises an event when archived, once (rule 2.2)', () => {
    const note = write()
    note.setPinned(true, created)

    note.archive(later)
    note.archive(new Date('2026-11-15T00:00:00Z'))

    expect(note.archivedAt).toEqual(later)
    expect(note.pinned).toBe(false)
    expect(note.domainEvents).toHaveLength(1)
    expect(note.domainEvents[0]).toBeInstanceOf(NoteArchivedEvent)
    expect(note.domainEvents[0].occurredAt).toEqual(later)
  })

  it('comes back from the archive', () => {
    const note = write()
    note.archive(created)

    note.unarchive(later)

    expect(note.isArchived).toBe(false)
    expect(note.updatedAt).toEqual(later)
  })

  it('is seen by its owner only (rule 0.4)', () => {
    const note = write()

    expect(canAccessNote({ id: 'owner-1', role: 'USER' }, note)).toBe(true)
    expect(canAccessNote({ id: 'someone-else', role: 'USER' }, note)).toBe(false)
    expect(canAccessNote({ id: 'someone-else', role: 'ADMIN' }, note)).toBe(false)
  })
})
