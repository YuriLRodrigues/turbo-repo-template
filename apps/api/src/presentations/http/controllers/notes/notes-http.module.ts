import { Module } from '@nestjs/common'

import { ArchiveNoteUseCase } from '@domain/notes/applications/use-cases/archive-note.use-case'
import { CreateNoteUseCase } from '@domain/notes/applications/use-cases/create-note.use-case'
import { DeleteNoteUseCase } from '@domain/notes/applications/use-cases/delete-note.use-case'
import { GetNoteUseCase } from '@domain/notes/applications/use-cases/get-note.use-case'
import { ListNotesUseCase } from '@domain/notes/applications/use-cases/list-notes.use-case'
import { UnarchiveNoteUseCase } from '@domain/notes/applications/use-cases/unarchive-note.use-case'
import { UpdateNoteUseCase } from '@domain/notes/applications/use-cases/update-note.use-case'
import { DatabaseModule } from '@infra/database/database.module'
import { TimeModule } from '@infra/time/time.module'

import { ArchiveNoteController } from './archive-note.controller'
import { CreateNoteController } from './create-note.controller'
import { DeleteNoteController } from './delete-note.controller'
import { GetNoteController } from './get-note.controller'
import { ListNotesController } from './list-notes.controller'
import { UnarchiveNoteController } from './unarchive-note.controller'
import { UpdateNoteController } from './update-note.controller'

/**
 * The HTTP edge of the example context. Its part of "export my data" and "delete my account" (`NotesUserData`,
 * rule 1.6) is registered in `IdentityHttpModule`, with the other contributors.
 */
@Module({
  imports: [DatabaseModule, TimeModule],
  controllers: [
    CreateNoteController,
    ListNotesController,
    GetNoteController,
    UpdateNoteController,
    ArchiveNoteController,
    UnarchiveNoteController,
    DeleteNoteController,
  ],
  providers: [
    CreateNoteUseCase,
    ListNotesUseCase,
    GetNoteUseCase,
    UpdateNoteUseCase,
    ArchiveNoteUseCase,
    UnarchiveNoteUseCase,
    DeleteNoteUseCase,
  ],
})
export class NotesHttpModule {}
