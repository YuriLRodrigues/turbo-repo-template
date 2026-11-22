import { Logger } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DomainEvents } from '@core/events/domain-events'
import { ArchiveNoteUseCase } from '@domain/notes/applications/use-cases/archive-note.use-case'
import { makeNotesWorld } from '@test/worlds/notes-world'

import { OnNoteArchived } from './on-note-archived.subscriber'

describe('OnNoteArchived', () => {
  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
    vi.restoreAllMocks()
  })

  it('reacts once the archived note is saved', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    new OnNoteArchived().setupSubscriptions()
    const world = makeNotesWorld()
    const note = world.storedNote()

    await new ArchiveNoteUseCase(world.notesRepository, world.clock).execute({
      actor: world.owner,
      noteId: note.id.toString(),
    })

    expect(log).toHaveBeenCalledWith(`Note ${note.id.toString()} archived by owner ${world.owner.id}`)
  })

  it('stops reacting after the module is destroyed', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const subscriber = new OnNoteArchived()
    subscriber.onModuleInit()
    subscriber.onModuleDestroy()
    const world = makeNotesWorld()
    const note = world.storedNote()

    note.archive(world.clock.now())
    await world.notesRepository.save(note)

    expect(log).not.toHaveBeenCalled()
  })
})
