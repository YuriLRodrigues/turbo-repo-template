import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'

import { DomainEvents } from '@core/events/domain-events'
import type { EventHandler } from '@core/events/event-handler'
import { NoteArchivedEvent } from '@domain/notes/enterprise/events/note-archived.event'

/**
 * Example side effect of `NoteArchivedEvent`. Replace the log with what the product needs (a notification, an
 * e-mail, a job in a queue, another context reacting). It catches its own errors: a failing side effect must not
 * fail the request that archived the note.
 */
@Injectable()
export class OnNoteArchived implements EventHandler, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnNoteArchived.name)
  private unregister?: () => void

  onModuleInit(): void {
    this.setupSubscriptions()
  }

  onModuleDestroy(): void {
    this.unregister?.()
  }

  setupSubscriptions(): void {
    this.unregister = DomainEvents.register<NoteArchivedEvent>((event) => this.handle(event), NoteArchivedEvent.name)
  }

  private handle({ note }: NoteArchivedEvent): void {
    try {
      this.logger.log(`Note ${note.id.toString()} archived by owner ${note.ownerId.toString()}`)
    } catch (error) {
      this.logger.error(`Could not handle NoteArchivedEvent for note ${note.id.toString()}`, error)
    }
  }
}
