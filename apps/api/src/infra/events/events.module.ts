import { Module } from '@nestjs/common'

import { DatabaseModule } from '@infra/database/database.module'

import { OnNoteArchived } from './subscribers/on-note-archived.subscriber'

/**
 * Every subscriber is a provider here, so it registers its handlers when the app boots.
 *
 * - `OnNoteArchived`: the example reaction to `NoteArchivedEvent` (it logs).
 */
@Module({
  imports: [DatabaseModule],
  providers: [OnNoteArchived],
})
export class EventsModule {}
